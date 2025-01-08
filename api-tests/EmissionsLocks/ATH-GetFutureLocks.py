import requests
import boto3
import json
import math
import json
import time 
import datetime
from botocore.exceptions import ClientError

EPOCH_DAY = 86400 
EPOCH_WEEK = 604800
EPOCH_MONTH = 2592000
current_epoch = time.time()
s3_client = boto3.client('s3')
# desired_symbol = ('SCRVUSD', 'DOLA', 'GHO', 'USDC', 'USDT', 'WETH', 'WBTC', 'WSTETH', 'RETH', 'SFRXETH', 'SUSDE', 'USDE')
# blacklist_project = ('clearpool-lending')

DEFILLAMA_PRO = 1

# TODOS: reply timestamp based on last_updated on S3 bucket, and make it Athena's timezone so it's coherent to twitter/humans.

def get_latest_emissions(data):
    # top 3 largest unlocks in 30 days
    # total unlocked amount
    list_emissions = []
    for i in data:
        curr_coin_price = 0
        if 'mcap' in i.keys():
            current_coin_price = i['mcap']/i['circSupply']
            for x in i['events']:
                unlock_timestamp = float(x['timestamp'])
                if current_epoch < unlock_timestamp and current_epoch + EPOCH_MONTH > unlock_timestamp:
                    tok_amount = 0
                    # check if already exists then combine value
                    if len(x['noOfTokens']) > 1:
                        tok_amount = sum(x['noOfTokens'][:])
                    else:
                        tok_amount = x['noOfTokens'][0]    
                    list_emissions.append({
                        "name": i['name'], 
                        "unlock_date": f"{datetime.datetime.fromtimestamp(x['timestamp']).strftime("%Y-%m-%d")}", 
                        "dollar_amount": int(tok_amount)*current_coin_price,
                        "token_amount": tok_amount,
                        "current_coin_price": round(current_coin_price,2),
                        "max_supply": i['maxSupply']
                    })
    combined = {}
    #if no mcap, delete
    total_unlock_price = 0
    for item in list_emissions:
        total_unlock_price += item['dollar_amount']
        key = (item['name'], item['unlock_date'])
        if key in combined:
            combined[key]['dollar_amount'] += round(item['dollar_amount'],2)
            combined[key]['token_amount'] += item['token_amount']
            combined[key]['percent_total'] = round(combined[key]['token_amount']/combined[key]['max_supply']*100,2)
        else:
            combined[key] = { 
                'name': item['name'], 
                'unlock_date': item['unlock_date'], 
                'dollar_amount': round(item['dollar_amount'],2),
                'token_amount': item['token_amount'],
                'current_coin_price': item['current_coin_price'],
                'max_supply': item['max_supply'],
                'percent_total': item['token_amount']/item['max_supply']*100
            }
    result = sorted(list(combined.values()), key=lambda x: x['dollar_amount'], reverse=True)
    for i in result:
        if "dollar_amount" in i.keys():
            i["dollar_amount"] = f"${i['dollar_amount']:,}"
        if "percent_total" in i.keys():
            i["percent_total"] = f"{i['percent_total']}%"
    result.insert(0, {'total_unlock_price': f"${round(total_unlock_price,2):,}"})
    return result

def fetch_emissions_data(curr_time):
    if DEFILLAMA_PRO:
        response = requests.get(f"https://pro-api.llama.fi/egbJblmxMkXtjsN9coJzdADQ836i9OM__nhMPzveppsHELaKv8SrUQ/api/emissions")
        s3_client.put_object(Body=response.text, Bucket='agent-data-miami', Key=f"athena/defillama/emissions-data/emissions-all-{curr_time}.json")
    else:
        print('API-KEY EXPIRED: please update the api token')

def main(emissions_content_object, curr_time):
    try: 
        latest_emissions = s3_client.get_object(Bucket='agent-data-miami', Key=f"athena/custom-calculations/emissions-data/latest_emissions-{curr_time}.json")
        latest_emissions = latest_emissions["Body"].read().decode()
        print('File already exists')
        if latest_emissions != {}:
            return latest_emissions
    except ClientError as ex: 
        if ex.response['Error']['Code'] == 'NoSuchKey': # means we have not calculated today yet
            print('No object found - please debug handler function!')
            emissions_defi_output = emissions_content_object["Body"].read().decode()
            latest_emissions = get_latest_emissions(json.loads(emissions_defi_output))
            if latest_emissions != []:
                s3_client.put_object(Body=json.dumps(latest_emissions), Bucket='agent-data-miami', Key=f"athena/custom-calculations/emissions-data/latest_emissions-{curr_time}.json")
            return latest_emissions
  
def lambda_handler(event, context):   
    latest_emissions = {}
    curr_time = datetime.datetime.now().strftime("%Y-%m-%d")
    try: 
        emissions_defi_output = s3_client.get_object(Bucket='agent-data-miami', Key=f"athena/defillama/emissions-data/emissions-all-{curr_time}.json")
        latest_emissions = main(emissions_defi_output, curr_time)
    except ClientError as ex:
        if ex.response['Error']['Code'] == 'NoSuchKey':
            print('No object found - please debug handler function!')
            fetch_emissions_data(curr_time)
            emissions_defi_output = s3_client.get_object(Bucket='agent-data-miami', Key=f"athena/defillama/emissions-data/emissions-all-{curr_time}.json")
            latest_emissions = main(emissions_defi_output, curr_time)
        else:
            print('Unexpected error: %s' % ex)
            raise
    # print(latest_emissions)
    body = json.loads(latest_emissions)
    body = json.dumps(body, indent=2)
    return {
        'statusCode': 200,
        "headers": {
            "Content-Type": "application/json"
        },
        'body': body
    }
