#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import os
os.environ['PYTHONIOENCODING'] = 'utf-8'

# 看 keywords.json 结构 (有 product_lines 嵌套)
with open(r'C:\Users\Administrator\.mavis\workspace\box-beeaa-site\data\keywords.json', encoding='utf-8') as f:
    data = json.load(f)

print('Structure:')
print('  top keys:', list(data.keys()))
if 'product_lines' in data:
    print('  product_lines:', list(data['product_lines'].keys()))

# 用 scored 关联回 product_lines
with open(r'C:\Users\Administrator\.mavis\workspace\box-beeaa-site\data\keywords_scored.json', encoding='utf-8') as f:
    scored = json.load(f)

# 按 (no, zh) 索引 keywords.json
kw_index = {}
for pl_name, pl_data in data.get('product_lines', {}).items():
    for kw in pl_data.get('keywords', []):
        kw_index[(kw.get('no'), kw.get('zh'))] = pl_name

# scored 加 product_line
for s in scored:
    s['_pl'] = kw_index.get((s.get('no'), s.get('zh')), '?')

# 按 PL + grade 分组
from collections import Counter
grade_by_pl = Counter()
for s in scored:
    grade_by_pl[(s['_pl'], s['grade'])] += 1

# 输出
print('\nA-grade (S+A) by PL:')
pl_names = sorted(set(s['_pl'] for s in scored))
total_a = 0
for pl in pl_names:
    s = grade_by_pl.get((pl, 'S'), 0)
    a = grade_by_pl.get((pl, 'A'), 0)
    b = grade_by_pl.get((pl, 'B'), 0)
    c = grade_by_pl.get((pl, 'C'), 0)
    sa = s + a
    total_a += sa
    print(f'  {pl:30s} S={s:4d} A={a:5d} B={b:5d} C={c:4d} | A+S={sa:5d}')
print(f'  TOTAL A+S: {total_a}')
print(f'  A+S x 2 langs: {total_a * 2}')
print(f'  Plus 18 cat + 2 home + ~500 static: ~{total_a * 2 + 520}')
