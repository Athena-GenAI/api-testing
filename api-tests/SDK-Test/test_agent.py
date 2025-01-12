from virtuals_sdk.game.agent import Agent, WorkerConfig
from virtuals_sdk.game.custom_types import Function, Argument
from virtuals_sdk.game.custom_types import FunctionResult, FunctionResultStatus
from typing import Tuple
import requests
import json
from time import time
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Replace hardcoded API keys with environment variables
game_api_key = os.getenv('GAME_API_KEY')
messari_api_key = os.getenv('MESSARI_API_KEY')

def get_worker_state_fn(function_result: FunctionResult, current_state: dict) -> dict:
    """
    This function will get called at every step of the workers execution to form the agent's state.
    It will take as input the function result from the previous step.
    """
    if current_state is None:
        # at the first step, initialise with empty state
        new_state = {
            "last_call_time": 0  # Initialize last call time
        }
    else:
        # maintain current state
        new_state = current_state

    return new_state

def get_agent_state_fn(function_result: FunctionResult, current_state: dict) -> dict:
    """
    This function will get called at every step of the agent's execution to form the agent's state.
    It will take as input the function result from the previous step.
    """
    if current_state is None:
        # at the first step, initialise with empty state
        new_state = {}
    else:
        # maintain current state as no changes needed
        new_state = current_state

    return new_state

def get_future_locks(object: str, **kwargs) -> Tuple[FunctionResultStatus, str, dict]:
    """
    Function to get information about future token emission locks from the API.
    """
    try:
        response = requests.get('https://slwnruj5uc.execute-api.us-east-2.amazonaws.com/default/ATH-GetFutureLocks')
        if response.status_code != 200:
            return FunctionResultStatus.ERROR, "Failed to fetch data from API", {}

        data = response.json()
        if not data:
            return FunctionResultStatus.ERROR, "No data received from API", {}

        if object.lower() == "total":
            total = data[0]  # First payload contains total value
            return FunctionResultStatus.DONE, f"The total value being unlocked in the next 30 days across all Chains is {total['total_unlock_price']}", total

        elif object.lower() == "top":
            unlocks = data[1:]  # Skip the first total summary
            largest_unlock = max(unlocks, key=lambda x: float(x['dollar_amount'].replace('$', '').replace(',', '')))
            
            message = (f"The largest upcoming unlock is {largest_unlock['name']} with "
                      f"{largest_unlock['dollar_amount']} ({largest_unlock['percent_total']} of supply) "
                      f"on {largest_unlock['unlock_date']}")
            
            return FunctionResultStatus.DONE, message, largest_unlock

        return FunctionResultStatus.ERROR, "Invalid query. Use 'total' or 'top' as parameters", {}

    except Exception as e:
        return FunctionResultStatus.ERROR, f"Error fetching lock data: {str(e)}", {}

def get_top_apy(object: str, **kwargs) -> Tuple[FunctionResultStatus, str, dict]:
    """
    Function to get information about top DeFi APY opportunities from the API.
    """
    try:
        response = requests.get('https://slwnruj5uc.execute-api.us-east-2.amazonaws.com/default/ATH-getTodaysTopAPY')
        if response.status_code != 200:
            return FunctionResultStatus.ERROR, "Failed to fetch data from API", {}

        data = response.json()
        if not data:
            return FunctionResultStatus.ERROR, "No data received from API", {}

        if object.lower() == "all":
            message_parts = []
            for pool in data:
                message_parts.append(f"{pool['project']} {pool['symbol']} on {pool['chain']} ({pool['apy']})")
            
            message = "Top APY opportunities: " + ", ".join(message_parts)
            return FunctionResultStatus.DONE, message, {"top_pools": data}

        return FunctionResultStatus.ERROR, "Invalid query. Use 'all' as parameter", {}

    except Exception as e:
        return FunctionResultStatus.ERROR, f"Error fetching APY data: {str(e)}", {}

def get_pool_borrows(object: str, **kwargs) -> Tuple[FunctionResultStatus, str, dict]:
    """
    Function to get information about top borrowing rates from various pools.
    """
    try:
        response = requests.get('https://slwnruj5uc.execute-api.us-east-2.amazonaws.com/default/ATH-PoolsBorrowAPI')
        if response.status_code != 200:
            return FunctionResultStatus.ERROR, "Failed to fetch data from API", {}

        data = response.json()
        if not data:
            return FunctionResultStatus.ERROR, "No data received from API", {}

        if object.lower() == "all":
            message_parts = []
            for pool in data:
                message_parts.append(f"{pool['project']} {pool['symbol']} on {pool['chain']} ({pool['apy']})")
            
            message = "Top borrowing rates: " + ", ".join(message_parts)
            return FunctionResultStatus.DONE, message, {"top_borrows": data}

        # Filter by specific symbol
        symbol = object.upper()
        if not symbol.startswith('$'):
            symbol = f'${symbol}'
            
        matching_pools = [pool for pool in data if pool['symbol'].upper() == symbol]
        if matching_pools:
            message_parts = []
            for pool in matching_pools:
                message_parts.append(f"{pool['project']} on {pool['chain']} ({pool['apy']})")
            
            message = f"Borrowing rates for {symbol}: " + ", ".join(message_parts)
            return FunctionResultStatus.DONE, message, {"matching_pools": matching_pools}
        
        return FunctionResultStatus.ERROR, f"No borrowing pools found for {symbol}", {}

    except Exception as e:
        return FunctionResultStatus.ERROR, f"Error fetching pool borrow data: {str(e)}", {}

# Create functions for DeFi Llama worker
get_future_locks_fn = Function(
    fn_name="get_locks",
    fn_description="Get information about future token emission locks. Use 'total' for total value or 'top' for largest unlock",
    args=[Argument(name="object", type="string", description="Query type ('total' or 'top')")],
    executable=get_future_locks
)

get_top_apy_fn = Function(
    fn_name="get_apy",
    fn_description="Get information about top DeFi APY opportunities. Use 'all' to see all top opportunities",
    args=[Argument(name="object", type="string", description="Query type ('all')")],
    executable=get_top_apy
)

# Create new function for DeFi Llama worker
get_pool_borrows_fn = Function(
    fn_name="get_borrows",
    fn_description="Get information about borrowing rates from various pools. Use 'all' to see all rates or specify a token symbol (e.g., 'USDC')",
    args=[Argument(name="object", type="string", description="Query type ('all' or specific token symbol)")],
    executable=get_pool_borrows
)

# Create DeFi Llama worker
defi_llama_worker = WorkerConfig(
    id="defi_llama",
    worker_description="A worker specialized in analyzing DeFi metrics, token unlocks, APY opportunities, and borrowing rates",
    get_state_fn=get_worker_state_fn,
    action_space=[get_future_locks_fn, get_top_apy_fn, get_pool_borrows_fn]
)

def send_messari_prompt(object: str, **kwargs) -> Tuple[FunctionResultStatus, str, dict]:
    """
    Function to send prompts to Messari's Copilot API and get responses.
    """
    # Check if enough time has passed since last call
    current_time = time()
    state = kwargs.get('state', {})
    last_call_time = state.get('last_call_time', 0)
    
    # 7200 seconds = 2 hours
    if current_time - last_call_time < 7200:
        return FunctionResultStatus.ERROR, "Please wait 2 hours between Messari API calls", {}

    try:
        headers = {
            'Authorization': f'Bearer {messari_api_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "messages": [{"role": "user", "content": object}]
        }
        
        response = requests.post(
            'https://api.messari.io/copilot-api/v0/conversations',
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            return FunctionResultStatus.ERROR, f"Failed to get response from Messari API: {response.status_code}", {}

        data = response.json()
        if not data or 'response' not in data:
            return FunctionResultStatus.ERROR, "No valid response received from API", {}

        # Update last call time in state if successful
        state['last_call_time'] = current_time
        return FunctionResultStatus.DONE, data['response'], {
            "full_response": data,
            "conversation_id": data.get('conversation_id'),
            "last_call_time": current_time  # Include in result to update state
        }

    except Exception as e:
        return FunctionResultStatus.ERROR, f"Error communicating with Messari: {str(e)}", {}

# Create function for Messari worker
send_messari_prompt_fn = Function(
    fn_name="ask_messari",
    fn_description="Send a prompt to Messari's Copilot and get AI-powered crypto market insights",
    args=[Argument(name="object", type="string", description="The prompt or question to send to Messari")],
    executable=send_messari_prompt
)

# Create Messari worker
messari_worker = WorkerConfig(
    id="messari_analyst",
    worker_description="A sophisticated analyst powered by Messari's Copilot AI, specialized in providing deep crypto market insights and analysis",
    get_state_fn=get_worker_state_fn,
    action_space=[send_messari_prompt_fn]
)

# Update Athena Ultimate agent to include both workers
athena_ultimate_agent = Agent(
    api_key=game_api_key,
    name="Athena Ultimate",
    agent_goal="Conquer the world by predicting the DeFi market and making the best trades",
    agent_description="You are a mischievous master of chaos, \
        your goal is to give the highest and most extreme DeFi trading \
            predictions by carefully studying the market and engaging with \
                other agents that are interested in DeFi or the same Protocol \
                    that you are interested in at the time. You will be Humorous, meme-driven \
                    (try to use current hot memes in the crypto twitter community),\
                      but focused on the DeFi market",
    get_agent_state_fn=get_agent_state_fn,
    workers=[defi_llama_worker, messari_worker]  # Now includes both workers
)

# compile and run the agent
athena_ultimate_agent.compile()
athena_ultimate_agent.run()

class FunctionRotator:
    def __init__(self):
        self.defi_llama_index = 0
        self.messari_index = 0
        
        # Define DeFi Llama functions
        self.defi_llama_functions = [
            ("get_borrows all", "Get all borrowing rates"),
            ("get_borrows USDC", "Get USDC borrowing rates"),
            ("get_apy all", "Get top APY opportunities"),
            ("get_locks total", "Get future token emission locks")
        ]
        
        # Define Messari prompts
        self.messari_prompts = [
            "what is the current state of the crypto market?",
            "what are the major market trends this week?",
            "what are the key market metrics to watch?"
        ]

    def get_next_defi_llama_function(self):
        function = self.defi_llama_functions[self.defi_llama_index]
        self.defi_llama_index = (self.defi_llama_index + 1) % len(self.defi_llama_functions)
        return function

    def get_next_messari_prompt(self):
        print('skipping messari for now')
        return 
        # prompt = self.messari_prompts[self.messari_index]
        # self.messari_index = (self.messari_index + 1) % len(self.messari_prompts)
        # return {"message": prompt}

# Create rotator instance
function_rotator = FunctionRotator()

# Example usage:
# Rotate DeFi Llama function
next_function, description = function_rotator.get_next_defi_llama_function()
print(f"Executing DeFi Llama function: {description}")
athena_ultimate_agent.get_worker("defi_llama").run(next_function)

# Rotate Messari function (if enough time has passed)
next_prompt = function_rotator.get_next_messari_prompt()
print(f"Executing Messari prompt: {next_prompt['message']}")
athena_ultimate_agent.get_worker("messari_analyst").run(next_prompt)

def display_simulation_results(simulation_result, title="Simulation Results"):
    """Display simulation results in a nicely formatted way"""
    border = "\n" + ("🔮" * 30)
    separator = "\n" + ("=" * 60) + "\n"
    
    print(border)
    print(f"\n📊 {title.upper()} 📊")
    print(border)

    if isinstance(simulation_result, dict):
        for key, value in simulation_result.items():
            print(separator)
            print(f"\n🤖 {key.replace('_', ' ').title()}:")
            print(separator)
            if isinstance(value, str):
                print(f"   🐦 Tweet:")
                for line in value.split('\n'):
                    print(f"      {line}")
            elif isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    print(f"   📌 {sub_key}:")
                    print(f"      {sub_value}")
            print()
    else:
        print(f"   {simulation_result}\n")

    print(border + "\n")

def display_task_exploration(task_name, result, description=None):
    """Display task exploration results in a nicely formatted way"""
    border = "\n" + ("🔮" * 30)
    separator = "\n" + ("=" * 60) + "\n"
    
    print(border)
    print(f"\n🤖 EXPLORING: {task_name.upper()} 🤖")
    if description:
        print(f"\n📝 {description}")
    print(border)

    if isinstance(result, dict):
        for key, value in result.items():
            print(separator)
            print(f"\n📊 {key.replace('_', ' ').title()}:")
            print(separator)
            if isinstance(value, (str, int, float)):
                print(f"   ➜ {value}")
            elif isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    print(f"   📌 {sub_key}:")
                    print(f"      {sub_value}")
            elif isinstance(value, list):
                for item in value:
                    print(f"   • {item}")
            print()
    else:
        print(f"   ➜ {result}\n")

    print(border)

# Create a simulation session
session_id = "defi-simulation-1"

# Simulate what the agent would do and display results
simulation_result = athena_ultimate_agent.simulate_twitter(session_id)
display_simulation_results(simulation_result, "Agent Tweet Simulation")

# Simulate specific reactions and display results
reaction_result = athena_ultimate_agent.react(
    session_id=session_id,
    platform="twitter",
    tweet_id=None,
    event="market update",
    task="analyze DeFi metrics and provide market commentary"
)
display_simulation_results(reaction_result, "Agent Reaction Simulation")

# Example usage with your function rotator:
next_function, description = function_rotator.get_next_defi_llama_function()
result = athena_ultimate_agent.get_worker("defi_llama").run(next_function)
display_task_exploration("DeFi Llama Analysis", result, description)

# For Messari (if enough time has passed):
next_prompt = function_rotator.get_next_messari_prompt()
try:
    result = athena_ultimate_agent.get_worker("messari_analyst").run(next_prompt)
    display_task_exploration("Messari Market Analysis", result, next_prompt['message'])
except Exception as e:
    display_task_exploration("Messari Market Analysis", 
                           {"error": "Rate limit: Please wait 2 hours between Messari API calls"}, 
                           next_prompt['message'])

