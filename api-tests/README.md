First of all - if you want to launch a lambda please follow 

-- create a zip file of requests.py and push all the folders to it (I uploaded requests.zip) this needs to be in all lambdas until we do a elastic storage in AWS which allows us to share this library across all our APIs.
pip3 install requests, then go to the requests folder that was just installed, zip it and upload it to Lambda.

-- lambda_template.py

this will show you the current template to follow which will 
1. pull the API data by current date 
2. store the API results in s3 bucket
3. process data
4. store processed data


