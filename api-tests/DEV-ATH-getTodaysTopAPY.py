# all lambdas should have a DEV-XXX-XXXXX.py
# they also need requests.zip to call import requests
import requests
import boto3
import json
import math

from botocore.exceptions import ClientError
from datetime import datetime

s3_client = boto3.client('s3')
desired_symbol = ('SCRVUSD', 'DOLA', 'GHO', 'USDC', 'USDT', 'WETH', 'WBTC', 'WSTETH', 'RETH', 'SFRXETH', 'SUSDE', 'USDE')
blacklist_project = ('clearpool-lending')

APY_TOP_COUNT = 3
DEFILLAMA_PRO = 1
# TODOS: reply timestamp based on last_updated on S3 bucket, and make it Athena's timezone so it's coherent to twitter/humans.

def fetch_pools_data(curr_time):
    if DEFILLAMA_PRO:
        response = requests.get(f"https://pro-api.llama.fi/egbJblmxMkXtjsN9coJzdADQ836i9OM__nhMPzveppsHELaKv8SrUQ/yields/pools")
        s3_client.put_object(Body=response.text, Bucket='agent-data-miami', Key=f"athena/defillama/pools-data/pools-all-{curr_time}.json")
    else:
        print('API-KEY EXPIRED: please update the api token')

def calculate_worthwhile_pools(pools):
    top_apys = {}
    list_apys = []
    for pool in pools['data']:
        if 'apy' in pool.keys():
            split_values = pool['symbol'].split('-')
            if pool['exposure'] == 'multi':
                if split_values[0] in desired_symbol and split_values[1] in desired_symbol and blacklist_project not in pool['project']:
                    if pool['apy'] > 80:
                        list_apys.append({
                            'chain': pool['chain'], 
                            'project': pool['project'], 
                            # 'protocol_1': split_values[0], 
                            # 'protocol_2': split_values[1], 
                            'symbol': pool['symbol'], 
                            'apy':  round(pool['apy'],2), 
                            # 'predictedClass': pool['predictions']['predictedClass'], 
                            # 'predictedProbability': pool['predictions']['predictedProbability'], 
                            # 'binnedConfidence': pool['predictions']['binnedConfidence']
                        })
            else:
                if split_values[0] in desired_symbol and blacklist_project not in pool['project']:
                    if pool['apy'] > 80:
                        list_apys.append({
                            'chain': pool['chain'], 
                            'project': pool['project'],
                            # 'protocol_1': split_values[0],
                            # 'protocol_2': '', 
                            'symbol': pool['symbol'], 
                            'apy': round(pool['apy'], 2),
                            # 'predictedClass': pool['predictions']['predictedClass'], 
                            # 'predictedProbability': pool['predictions']['predictedProbability'], 
                            # 'binnedConfidence': pool['predictions']['binnedConfidence']
                        })
    sorted_items = sorted(list_apys, key=lambda x: x['apy'], reverse=True)
    desired_items = sorted_items[:3]
    for item in desired_items:
        item['apy'] = f"{item['apy']}%"
    return json.dumps(desired_items)


def main(pools_content_object, curr_time):
    try: 
        pools_sorted_object = s3_client.get_object(Bucket='agent-data-miami', Key=f"athena/custom-calculations/pools-data/sorted-top-apy-{curr_time}.json")
        best_pools_sorted = pools_sorted_object["Body"].read().decode()
        print('File already exists')
        if best_pools_sorted != {}:
            return best_pools_sorted
    except ClientError as ex: 
        if ex.response['Error']['Code'] == 'NoSuchKey': # means we have not calculated today yet
            print('No object found - please debug handler function!')
            pools_text = pools_content_object["Body"].read().decode()
            best_pools = calculate_worthwhile_pools(json.loads(pools_text))
            if best_pools != []:
                s3_client.put_object(Body=best_pools, Bucket='agent-data-miami', Key=f"athena/custom-calculations/pools-data/sorted-top-apy-{curr_time}.json")
            return best_pools
  
def lambda_handler(event, context):   
    best_pools_sorted = {}
    curr_time = datetime.now().strftime("%Y-%m-%d-%H")
    try: 
        pools_content_object = s3_client.get_object(Bucket='agent-data-miami', Key=f"athena/defillama/pools-data/pools-all-{curr_time}.json")
        best_pools_sorted = main(pools_content_object, curr_time)
    except ClientError as ex:
        if ex.response['Error']['Code'] == 'NoSuchKey':
            print('No object found - please debug handler function!')
            fetch_pools_data(curr_time)
            pools_content_object = s3_client.get_object(Bucket='agent-data-miami', Key=f"athena/defillama/pools-data/pools-all-{curr_time}.json")
            best_pools_sorted = main(pools_content_object, curr_time)
        else:
           print('Unexpected error: %s' % ex)
           raise
    body = json.loads(best_pools_sorted)
    body = json.dumps(body, indent=2)
    return {
        'statusCode': 200,
        "headers": {
            "Content-Type": "application/json"
        },
        'body': body
    } 
