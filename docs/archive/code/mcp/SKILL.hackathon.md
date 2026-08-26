---
name: travel-blocks
description: Convert travel URLs or itinerary text into Day-based block itineraries for Travel Blocks AI, then help users rearrange, add, and refine travel blocks.
---

# Travel Blocks AI Skill

Use this skill when a user wants to create or refine a MyRealTrip-style travel itinerary from a YouTube URL string, blog URL, ordinary travel URL, or free-form travel text.

## Mode Summary

- Web UI Real mode: the React app uses `VITE_USE_MOCK=false` by default. Server proxy routes call Gemini for trip generation/link-text analysis/recommendations and Nominatim for place search, coordinates, and reverse geocoding.
- Web UI fallback mode: when an external API fails, times out, returns invalid JSON, or a provider key is unavailable, `VITE_AUTO_FALLBACK=true` keeps the app running with Mock/safe fallback data.
- Web UI Mock mode: `VITE_USE_MOCK=true` explicitly selects development and QA Mock data.
- MCP tool mode: the MCP server does not call Gemini, Nominatim, YouTube transcript APIs, or blog crawlers. It provides input-based deterministic fallback itineraries so the plugin can be evaluated without external credentials.
- MCP environment: `TRAVEL_BLOCKS_USE_MOCK` is read by `src/mcp/server.mjs`. If it is set to `false`, the server still returns deterministic fallback because Real MCP providers are not implemented.

## What Is Implemented

- Accept natural-language input with a destination, duration, and theme.
- Extract common destinations such as 부산, 도쿄, 제주, 오사카, 후쿠오카, 교토, 대마도, 거제.
- Extract durations such as `2박 3일`, `3일`, `당일치기`, and `일주일` with a maximum day limit.
- Extract themes such as 미식, 가족, 커플, 역사·문화, 콘텐츠·성지순례, 자연·힐링, 쇼핑, and 종합 여행.
- Generate deterministic Day groups and travel blocks from the extracted input.
- Return the same result for the same input and different results for different city/duration/theme combinations.
- Keep generated itineraries editable and modular.

## What Is Not Claimed

- The MVP does not extract full YouTube transcripts.
- The MVP does not guarantee complete blog body crawling for every URL.
- The MCP tool output is not real Gemini output.
- URL inputs are used as analysis context and source-type signals; the core MVP focuses on turning available input and travel conditions into structured itinerary blocks.

## MCP Tool: analyze_travel_source

Input schema:

```json
{
  "sourceType": "youtube | blog | text",
  "content": "Travel URL, blog URL, YouTube URL string, or free-form travel request"
}
```

Example tool call arguments:

```json
{
  "sourceType": "text",
  "content": "부산 2박 3일 맛집 여행 일정을 만들어줘"
}
```

Output shape:

```json
{
  "content": [
    {
      "type": "text",
      "text": "JSON string containing mode, sourceType, analysis, note, and days"
    }
  ]
}
```

The `text` field contains JSON with:

- `mode`: `deterministic-fallback`
- `sourceType`: echoed input source type
- `analysis.destination`: extracted destination or `추천 여행지`
- `analysis.durationDays`: extracted day count
- `analysis.theme`: extracted theme
- `days`: `TravelDay[]` compatible Day groups

## Output Contract

Each Day group should include:

- stable `id`
- `dayNumber`
- `title`
- optional `city` and `region`
- `blocks`

Each block should include:

- stable `id`
- `title`
- `category`
- `priceLevel`
- optional `time`, `location`, `memo`, `estimatedCost`

## User Guidance

When helping users with this plugin:

1. Ask for a travel source only when no URL or itinerary text is available.
2. Encourage users to include 도시, 기간, 목적 or 테마 for better fallback output.
3. Prefer concrete block names such as `숙소 체크인`, `해안 산책`, `카페 휴식`.
4. Do not ask users to provide API keys in chat.
5. Do not describe MCP output as real Gemini output.
6. For web UI Real mode, keep provider calls server-side and normalize output to the app's `TravelDay[]` or `TravelPlanPayload` shape.
