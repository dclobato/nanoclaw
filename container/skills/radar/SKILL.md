---
name: radar
description: Fetch and send the IPMet weather radar image for São José do Rio Preto. Use when user asks about weather, rain (chuva), radar, or current weather conditions in the region.
allowed-tools: Bash, WebFetch
---

# Radar Meteorológico IPMet

## Step 1 — Download radar image

```bash
TIMESTAMP=$(date +%s)
RAND=$(shuf -i 10000-99999 -n 1 2>/dev/null || echo $RANDOM)
curl -fsSL "https://www.ipmetradar.com.br/ipmet_html/radar/nova.jpg?cb=${TIMESTAMP}&_=${RAND}" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0" \
  -H "Accept: image/avif,image/webp,image/png,image/*;q=0.8,*/*;q=0.5" \
  -H "Accept-Language: pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3" \
  -H "Referer: https://www.ipmetradar.com.br/" \
  -H "Cache-Control: no-cache" \
  -o /workspace/group/radar.png
```

## Step 2 — Fetch forecast text

Use WebFetch on `https://www.ipmetradar.com.br/2tempo.php`. Extract the paragraph relevant to São José do Rio Preto.

## Step 3 — Compose response

Your response MUST include `MEDIA: /workspace/group/radar.png` on its own line — NanoClaw detects this and attaches the image automatically.

```
📡 Radar atualizado — [HH:MM]

MEDIA: /workspace/group/radar.png

[1-2 lines: rain intensity (fraca/moderada/forte), direction, coverage area]

Previsão IPMet para São José do Rio Preto: [extracted from 2tempo.php]
```

Notes:
- Always fetch a fresh image (cache buster prevents stale results)
- Focus forecast on São José do Rio Preto specifically
- The MEDIA: line is automatically removed from the text sent to the user
