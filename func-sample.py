import logging
from PIL import Image
import requests
import os, uuid
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient


import azure.functions as func


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    STORAGE_CONN_STRING = os.environ["STORAGE_CONN_STRING"]
    
    req_body = req.get_json()
    imgUrl = req_body.get('imgURL')

    blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONN_STRING)

    container_name = f"story-images/{req_body.get('storyID')}"
    file_name = f"{req_body.get('imgID')}.png"

    blob_client = blob_service_client.get_blob_client(container=container_name, blob=file_name)

    im = Image.open(requests.get(imgUrl, stream=True).raw)

    blob_client.upload_blob_from_url(imgUrl)

    return func.HttpResponse(
                "Saved iamge to blob",
                status_code=200
        )