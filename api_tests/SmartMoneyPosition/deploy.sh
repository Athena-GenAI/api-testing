#!/bin/bash

# Exit on error
set -e

# Check if environment parameter is provided
if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh <environment>"
    echo "Example: ./deploy.sh dev"
    exit 1
fi

ENVIRONMENT=$1
STACK_NAME="smart-money-position-$ENVIRONMENT"

echo "Deploying to $ENVIRONMENT environment..."

# Install dependencies
pip install -r requirements.txt

# Create deployment package
echo "Creating deployment package..."
mkdir -p .aws-sam/build

# Build the SAM application
sam build

# Deploy to AWS
echo "Deploying to AWS..."
sam deploy \
    --template-file .aws-sam/build/template.yaml \
    --stack-name $STACK_NAME \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides Environment=$ENVIRONMENT \
    --no-confirm-changeset

echo "Deployment complete!"

# Get the API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text)

echo "API Endpoint: $API_ENDPOINT"
