#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys, io, boto3, json, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

creds = json.load(open(r'C:\Users\Administrator\Desktop\cf-creds.json', encoding='utf-8'))
s3 = boto3.client(
    's3',
    endpoint_url=f"https://{creds['account_id']}.r2.cloudflarestorage.com",
    aws_access_key_id=creds['access_key_id'],
    aws_secret_access_key=creds['secret_access_key'],
    region_name='auto',
)

# Check the R2 file content
key = 'engineering-plastic-case/airtight-聚丙烯改性塑料箱-26663/index.html'
print(f'Fetching: {key}')
try:
    resp = s3.get_object(Bucket='box-en-b', Key=key)
    body = resp['Body'].read().decode('utf-8', errors='replace')
    print(f'  size: {len(body)} bytes')
    noS = re.sub(r'<script[^>]*>.*?</script>', '', body, flags=re.S)
    noS = re.sub(r'<style[^>]*>.*?</style>', '', noS, flags=re.S)
    zh = re.findall(r'[\u4e00-\u9fff]+', noS)
    print(f'  visible zh: {len(zh)}')
    title = re.search(r'<title>([^<]+)</title>', body)
    h1 = re.search(r'<h1[^>]*>([^<]+)</h1>', body)
    print(f'  title: {title.group(1) if title else "(none)"}')
    print(f'  h1: {h1.group(1) if h1 else "(none)"}')
    # 找 聚丙烯 上下文
    ctx = re.search(r'.{30}聚丙烯.{30}', body)
    if ctx:
        print(f'  context: {ctx.group(0)}')
except Exception as e:
    print(f'  ERR: {e}')
