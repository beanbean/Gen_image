#!/usr/bin/env python3
import json
import sys

data = json.loads(sys.stdin.read())

print("=== WORKFLOWS LIÊN QUAN GEN_IMAGE ===\n")
for wf in data['data']:
    keywords = ['render', 'image', 'leaderboard', 'player', 'zalo', 'captain', 'team']
    if any(keyword in wf['name'].lower() for keyword in keywords):
        print(f"ID: {wf['id']}")
        print(f"Name: {wf['name']}")
        print(f"Active: {wf['active']}")
        print(f"Created: {wf['createdAt']}")
        print('---')
