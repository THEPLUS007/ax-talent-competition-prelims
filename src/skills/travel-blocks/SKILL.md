---
name: travel-blocks
description: Convert travel links or itinerary text into Day-based block itineraries for Travel Blocks AI, then help users rearrange, add, and refine travel blocks.
---

# Travel Blocks AI Skill

Use this skill when a user wants to create or refine a MyRealTrip-style travel itinerary from a Youtube URL, blog URL, or free-form travel text.

## MVP Behavior

- Create a trip with name, country, duration, and description.
- Analyze Youtube URLs, blog URLs, or itinerary text through the app service layer.
- In the hackathon MVP, analysis uses Mock data when `TRAVEL_BLOCKS_USE_MOCK` or the UI Mock switch is enabled.
- Return schedules as `Day 1`, `Day 2`, and `Day 3` blocks.
- Treat each itinerary item as a movable block with category, title, location, time, price level, and memo.
- Price level color rules:
  - `low`: green
  - `medium`: yellow
  - `high`: red

## User Guidance

When helping users with this plugin:

1. Ask for a travel source only when no URL or itinerary text is available.
2. Keep generated itineraries editable and modular.
3. Prefer concrete block names such as `숙소 체크인`, `성산일출봉 산책`, `흑돼지 점심`.
4. Do not expose API keys or request secrets in client code.
5. For real AI integration, route model calls through a server or MCP tool and normalize output to the app's `TravelDay[]` shape.

## Output Contract

The app expects analysis results shaped as Day groups. Each block should include:

- stable `id`
- `title`
- `category`
- `priceLevel`
- optional `time`, `location`, `memo`, `estimatedCost`

## Current Limitation

This preliminary submission intentionally uses deterministic Mock data so judges can run the product without external credentials.
