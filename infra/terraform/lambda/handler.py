import json
import time
import boto3
import os

dynamodb = boto3.resource('dynamodb')

table_name = os.environ.get('SESSION_TABLE', 'nextgensecurity-sessions-dev')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    print("EVENT:", json.dumps(event))

    detail = event.get('detail', {})

    session_id = detail.get('sessionId', str(int(time.time())))
    camera_id = detail.get('cameraId', 'unknown')
    action = detail.get('action', 'start')

    if action == 'start':
        table.put_item(Item={
            'sessionId': session_id,
            'cameraId': camera_id,
            'startTs': int(time.time()),
            'status': 'ACTIVE'
        })

    elif action == 'end':
        table.update_item(
            Key={'sessionId': session_id},
            UpdateExpression="SET endTs = :e, #s = :s",
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={
                ':e': int(time.time()),
                ':s': 'COMPLETED'
            }
        )

    return {
        'statusCode': 200,
        'body': json.dumps('processed')
    }
