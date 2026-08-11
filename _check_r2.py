#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Check R2 content for engineering-plastic-case."""
import os, sys, io, boto3, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

creds = json.load(open(r'C:\Users\Administrator\Desktop\cf-creds.json', encoding='utf-8'))
s3 = boto3.client(
    's3',
    endpoint_url=f"https://{creds['account_id']}.r2.cloudflarestorage.com",
    aws_access_key_id=creds['access_key_id'],
    aws_secret_access_key=creds['secret_access_key'],
    region_name='auto',
)

# Check box-en-b for engineering-plastic-case
print('=== box-en-b engineering-plastic-case ===')
try:
    resp = s3.list_objects_v2(Bucket='box-en-b', Prefix='engineering-plastic-case/', Delimiter='/', MaxKeys=10)
    print(f'  CommonPrefixes: {len(resp.get("CommonPrefixes", []))}')
    for cp in resp.get('CommonPrefixes', [])[:5]:
        print(f'    {cp["Prefix"]}')
except Exception as e:
    print(f'  ERR: {e}')

# Check if engineering-plastic-case/index.html exists in box-en-b
try:
    resp = s3.get_object(Bucket='box-en-b', Key='engineering-plastic-case/index.html')
    body = resp['Body'].read()
    body_str = body.decode('utf-8', errors='replace')
    print(f'\n  box-en-b/engineering-plastic-case/index.html exists: {len(body)} bytes')
    import re
    noS = re.sub(r'<script[^>]*>.*?</script>', '', body_str, flags=re.S)
    noS = re.sub(r'<style[^>]*>.*?</style>', '', noS, flags=re.S)
    zh = re.findall(r'[\u4e00-\u9fff]+', noS)
    print(f'  visible zh: {len(zh)}')
    from collections import Counter
    for s, c in Counter(zh).most_common(5):
        print(f'    {s} (x{c})')
except Exception as e:
    print(f'  ERR: {e}')

# Also check box-en (main bucket, not box-en-b)
print('\n=== box-en (main bucket) engineering-plastic-case ===')
try:
    resp = s3.list_objects_v2(Bucket='box-en', Prefix='engineering-plastic-case/', Delimiter='/', MaxKeys=10)
    print(f'  CommonPrefixes: {len(resp.get("CommonPrefixes", []))}')
    for cp in resp.get('CommonPrefixes', [])[:5]:
        print(f'    {cp["Prefix"]}')
except Exception as e:
    print(f'  ERR: {e}')
