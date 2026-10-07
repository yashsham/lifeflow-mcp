"""
NVIDIA NIM LLM Client Configuration
Model: nvidia/nemotron-3.5-lightning-30b-a3b
Host: https://integrate.api.nvidia.com/v1
"""

import os
from openai import OpenAI

NVIDIA_API_KEY = os.getenv(
    "NVIDIA_API_KEY",
    "nvapi-lHQkAqIvlXAbXf3exRu_puVpajkgkgjlkweuhrj6_OwnjHuEhJq-Ih7YpYQltkLJxsW_5_9dv5OJV1eL"
)

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b"

def get_nvidia_client() -> OpenAI:
    return OpenAI(
        base_url=NVIDIA_BASE_URL,
        api_key=NVIDIA_API_KEY
    )
