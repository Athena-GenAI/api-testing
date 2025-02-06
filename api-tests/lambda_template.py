import requests
import boto3
import json
import math
import time 
import datetime

from botocore.exceptions import ClientError

s3_client = boto3.client('s3')
DEFILLAMA_PRO = 1
API_KEY = 'egbJblmxMkXtjsN9coJzdADQ836i9OM__nhMPzveppsHELaKv8SrUQ'
API_URL = f"https://pro-api.llama.fi/{API_KEY}/api/emissions"

def fetch_<YOUR_DATATYPE>_data(curr_time):
    """
    params:
        curr_time - used to create a unique filename based on date 
    """
    datatype = <YOUR_DATATYPE>
    if DEFILLAMA_PRO:
        response = requests.get(API_URL)
        s3_client.put_object(Body=response.text, Bucket='agent-data-miami', Key=f"athena/defillama/{datatype}-data/{datatype}-all-{curr_time}.json")
    else:
        print('API-KEY EXPIRED: please update the api token')



def get_latest_<YOUR_DATATYPE>(data):
    #Calculations go here - do a json.loads(data) in main function as parameter for this.    
    result = {}
    for i in data:
        print(i['symbol']
        result[i['symbol']] = i['apy'] 
    #dont json.dump() here
    return result

def sort_here_<YOUR_DATATYPE>(data):
    # fetch in one function, calculate in one function, sort in another function (unless its super simple sorting)
    pass

def main(<YOUR_DATATYPE>_content_object, curr_time):
    datatype = <YOUR_DATATYPE>
    try: 
        # Check if we've calculated - to skip the get_latest_<YOUR_DATATYPE> function - keep lambda cheap!!
        latest_<YOUR_DATATYPE> = s3_client.get_object(Bucket='agent-data-miami', Key=f"athena/custom-calculations/{datatype}-data/latest_{datatype}-{curr_time}.json")
        latest_<YOUR_DATATYPE> = latest_<YOUR_DATATYPE>["Body"].read().decode()
        if latest_<YOUR_DATATYPE> != {}:
            return latest_<YOUR_DATATYPE>
    except ClientError as ex: 
        if ex.response['Error']['Code'] == 'NoSuchKey': 
            # means we have not calculated yet in current timestamp, be it by hour or by day
            print('No object found - please debug handler function!')
            <YOUR_DATATYPE>_defi_output = <YOUR_DATATYPE>_content_object["Body"].read().decode()
            latest_<YOUR_DATATYPE> = get_latest_<YOUR_DATATYPE>(json.loads(<YOUR_DATATYPE>_defi_output))
            if latest_<YOUR_DATATYPE> != []:
                s3_client.put_object(Body=json.dumps(latest_<YOUR_DATATYPE>), Bucket='agent-data-miami', Key=f"athena/custom-calculations/<YOUR_DATATYPE>-data/latest_<YOUR_DATATYPE>-{curr_time}.json")
            # dont json.dump() here dont ["Body"].read.decode() here, it is already good to go.
            return latest_<YOUR_DATATYPE>
  
def lambda_handler(event, context):   
    latest_<YOUR_DATATYPE> = {}
    curr_time = datetime.datetime.now().strftime("%Y-%m-%d")
    try: 
        <YOUR_DATATYPE>_defi_output = s3_client.get_object(Bucket='agent-data-miami', Key=f"athena/defillama/<YOUR_DATATYPE>-data/<YOUR_DATATYPE>-all-{curr_time}.json")
        latest_<YOUR_DATATYPE> = main(<YOUR_DATATYPE>_defi_output, curr_time)
    except ClientError as ex:
        if ex.response['Error']['Code'] == 'NoSuchKey':
            print('No object found - please debug handler function!')
            fetch_<YOUR_DATATYPE>_data(curr_time)
            <YOUR_DATATYPE>_defi_output = s3_client.get_object(Bucket='agent-data-miami', Key=f"athena/defillama/<YOUR_DATATYPE>-data/<YOUR_DATATYPE>-all-{curr_time}.json")
            latest_<YOUR_DATATYPE> = main(<YOUR_DATATYPE>_defi_output, curr_time)
        else:
            print('Unexpected error: %s' % ex)
            raise
    # this makes the JSON output nicely
    body = json.loads(latest_<YOUR_DATATYPE>)
    body = json.dumps(body, indent=2)
    return {
        'statusCode': 200,
        "headers": {
            "Content-Type": "application/json"
        },
        'body': body
    }
