const encoder = new TextEncoder();

const mockDays = [
  {
    id: 'mcp-day-1',
    dayNumber: 1,
    title: 'MCP Mock Day 1',
    blocks: [
      {
        id: 'mcp-block-checkin',
        title: '숙소 체크인',
        category: 'stay',
        priceLevel: 'medium',
        time: '15:00',
        location: '제주시',
        memo: 'MCP Mock 분석 결과',
        estimatedCost: '120,000원',
      },
    ],
  },
];

function writeMessage(message) {
  const payload = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${encoder.encode(payload).length}\r\n\r\n${payload}`);
}

function createResponse(id, result) {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

function createError(id, message) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32000,
      message,
    },
  };
}

function handleRequest(request) {
  try {
    if (request.method === 'initialize') {
      return createResponse(request.id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'travel-blocks-ai-local',
          version: '0.1.0',
        },
      });
    }

    if (request.method === 'tools/list') {
      return createResponse(request.id, {
        tools: [
          {
            name: 'analyze_travel_source',
            description: 'Return deterministic mock Travel Blocks AI itinerary data.',
            inputSchema: {
              type: 'object',
              properties: {
                sourceType: {
                  type: 'string',
                  enum: ['youtube', 'blog', 'text'],
                },
                content: {
                  type: 'string',
                },
              },
              required: ['sourceType', 'content'],
            },
          },
        ],
      });
    }

    if (request.method === 'tools/call') {
      const toolName = request.params?.name;

      if (toolName !== 'analyze_travel_source') {
        return createError(request.id, `Unknown tool: ${toolName}`);
      }

      return createResponse(request.id, {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ days: mockDays }, null, 2),
          },
        ],
      });
    }

    if (request.id === undefined) {
      return null;
    }

    return createError(request.id, `Unsupported method: ${request.method}`);
  } catch (error) {
    return createError(request.id, error instanceof Error ? error.message : 'Unknown MCP server error');
  }
}

let buffer = Buffer.alloc(0);

process.stdin.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);

  while (buffer.length > 0) {
    const headerEnd = buffer.indexOf('\r\n\r\n');

    if (headerEnd === -1) {
      break;
    }

    const header = buffer.slice(0, headerEnd).toString('utf8');
    const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);

    if (!lengthMatch) {
      buffer = buffer.slice(headerEnd + 4);
      continue;
    }

    const contentLength = Number(lengthMatch[1]);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + contentLength;

    if (buffer.length < messageEnd) {
      break;
    }

    const rawMessage = buffer.slice(messageStart, messageEnd).toString('utf8');
    buffer = buffer.slice(messageEnd);

    const response = handleRequest(JSON.parse(rawMessage));

    if (response) {
      writeMessage(response);
    }
  }
});
