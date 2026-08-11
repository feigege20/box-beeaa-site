#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re

def enClean(s):
    if not s or not isinstance(s, str):
        return s
    r = re.sub(r'[\s\u3000]*[\u4e00-\u9fff]+[\s\u3000]*', ' ', s)
    r = re.sub(r'\s+', ' ', r)
    r = re.sub(r'[-–—,.:;!?]+\s*$', '', r).strip()
    return r or s

tests = [
    ('Waterproof 聚丙烯改性塑料箱', 'Waterproof'),
    ('IP67 Waterproof 聚丙烯改性塑料箱', 'IP67 Waterproof'),
    ('Waterproof pp-箱', 'Waterproof pp'),
    ('PP Case / Polypropylene Box', 'PP Case / Polypropylene Box'),
    ('Dustproof pp-箱', 'Dustproof pp'),
    ('Shockproof pp-箱', 'Shockproof pp'),
    ('Empty', ''),
    ('Custom PP Case 聚丙烯改性塑料箱 Manufacturer', 'Custom PP Case Manufacturer'),
    ('ABS Case / Acrylonitrile Box', 'ABS Case / Acrylonitrile Box'),
    ('Air-Drop Case 军品 空投箱', 'Air-Drop Case'),
    ('Air-Drop Case 军品空投箱', 'Air-Drop Case'),
    ('  IP67 Waterproof 聚丙烯改性塑料箱  ', 'IP67 Waterproof'),
    ('EVA Foam 工具箱', 'EVA Foam'),
    ('Tool Box / 工具箱', 'Tool Box /'),
]
all_ok = True
for inp, expect in tests:
    got = enClean(inp)
    mark = 'OK' if got == expect else 'FAIL'
    if mark == 'FAIL':
        all_ok = False
    print(f'  {mark}: {inp!r:60s} -> {got!r}  (expect {expect!r})')
print()
print('ALL PASS' if all_ok else 'SOME FAILED')
