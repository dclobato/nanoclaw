---
name: radar
description: Download and display IPMet weather radar for São José do Rio Preto region with forecast summary.
---

# Radar Meteorológico IPMet

Download the latest weather radar image from IPMet and provide a summary of current conditions for São José do Rio Preto.

## Quick Usage

Simply execute the workflow below when the user asks for radar, weather radar, or rain status in the region.

## Workflow

1. **Download radar image**:
   ```bash
   cd /home/dclobato/radar-ipmet && uv run download_radar.py
   ```
   
2. **Prepare image for delivery**:
   ```bash
   cp /home/dclobato/radar-ipmet/radar.png /home/dclobato/.openclaw/media/outbound/radar.png
   ```

3. **Fetch forecast summary**:
   Use `web_fetch` to get content from:
   ```
   https://www.ipmetradar.com.br/2tempo.php
   ```
   Extract information relevant to São José do Rio Preto.

4. **Deliver response**:
   - Include image path in response for OpenClaw to attach: `MEDIA: /home/dclobato/.openclaw/media/outbound/radar.png`
   - Include short analysis (1-2 lines): rain intensity, direction, coverage
   - Include forecast summary from 2tempo.php focused on São José do Rio Preto

## Response Format

The response must include the literal `MEDIA:` line for OpenClaw to attach the image:

```
📡 Radar atualizado da região

MEDIA: /home/dclobato/.openclaw/media/outbound/radar.png

Resumo curto: [análise visual do radar - chuva fraca/moderada/forte, direção, cobertura]

Previsão IPMet (São José do Rio Preto): [resumo extraído de 2tempo.php]
```

## Notes

- Radar updates frequently; each execution fetches the latest image
- Focus forecast summary specifically on São José do Rio Preto when extracting from 2tempo.php
