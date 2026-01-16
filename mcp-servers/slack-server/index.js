import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { WebClient } from '@slack/web-api';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import dotenv from 'dotenv';
dotenv.config();

// Initialize Slack client
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// Create MCP Server
const server = new Server(
  {
    name: 'slack-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
server.setRequestHandler(
  ListToolsRequestSchema,
  async () => {
  return {
    tools: [
      {
        name: 'list_channels',
        description: 'List all channels in the workspace',
        inputSchema: {
          type: 'object',
          properties: {
            types: {
              type: 'string',
              description: 'Channel types (public_channel, private_channel, im, mpim)',
              default: 'public_channel'
            }
          }
        }
      },
      {
        name: 'get_channel_history',
        description: 'Get recent messages from a channel',
        inputSchema: {
          type: 'object',
          properties: {
            channel_id: {
              type: 'string',
              description: 'Channel ID (e.g., C01234567)'
            },
            limit: {
              type: 'number',
              description: 'Number of messages to retrieve',
              default: 10
            }
          },
          required: ['channel_id']
        }
      },
      {
        name: 'post_message',
        description: 'Post a message to a channel',
        inputSchema: {
          type: 'object',
          properties: {
            channel_id: {
              type: 'string',
              description: 'Channel ID or name'
            },
            text: {
              type: 'string',
              description: 'Message text'
            },
            thread_ts: {
              type: 'string',
              description: 'Thread timestamp (to reply in thread)'
            }
          },
          required: ['channel_id', 'text']
        }
      },
      {
        name: 'search_messages',
        description: 'Search for messages in the workspace',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            },
            count: {
              type: 'number',
              description: 'Number of results',
              default: 10
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_user_info',
        description: 'Get information about a user',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'User ID (e.g., U01234567)'
            }
          },
          required: ['user_id']
        }
      },
      {
        name: 'list_users',
        description: 'List all users in the workspace',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'add_reaction',
        description: 'Add a reaction emoji to a message',
        inputSchema: {
          type: 'object',
          properties: {
            channel_id: {
              type: 'string',
              description: 'Channel ID'
            },
            timestamp: {
              type: 'string',
              description: 'Message timestamp'
            },
            emoji: {
              type: 'string',
              description: 'Emoji name (without colons, e.g., "thumbsup")'
            }
          },
          required: ['channel_id', 'timestamp', 'emoji']
        }
      },
      {
        name: 'get_thread_replies',
        description: 'Get replies in a message thread',
        inputSchema: {
          type: 'object',
          properties: {
            channel_id: {
              type: 'string',
              description: 'Channel ID'
            },
            thread_ts: {
              type: 'string',
              description: 'Thread timestamp'
            }
          },
          required: ['channel_id', 'thread_ts']
        }
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler(
  CallToolRequestSchema,
  async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_channels': {
        const result = await slack.conversations.list({
          types: args.types || 'public_channel',
          exclude_archived: true
        });

        const channels = result.channels.map(channel => ({
          id: channel.id,
          name: channel.name,
          is_private: channel.is_private,
          member_count: channel.num_members,
          topic: channel.topic?.value || '',
          purpose: channel.purpose?.value || ''
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(channels, null, 2)
          }]
        };
      }

      case 'get_channel_history': {
        const result = await slack.conversations.history({
          channel: args.channel_id,
          limit: args.limit || 10
});
const messages = result.messages.map(msg => ({
      user: msg.user || msg.bot_id,
      text: msg.text,
      timestamp: msg.ts,
      thread_ts: msg.thread_ts,
      reply_count: msg.reply_count || 0,
      reactions: msg.reactions?.map(r => ({
        name: r.name,
        count: r.count
      })) || []
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(messages, null, 2)
      }]
    };
  }

  case 'post_message': {
    const params = {
      channel: args.channel_id,
      text: args.text
    };

    if (args.thread_ts) {
      params.thread_ts = args.thread_ts;
    }

    const result = await slack.chat.postMessage(params);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          channel: result.channel,
          timestamp: result.ts,
          message: result.message.text
        }, null, 2)
      }]
    };
  }

  case 'search_messages': {
    const result = await slack.search.messages({
      query: args.query,
      count: args.count || 10
    });

    const messages = result.messages.matches.map(msg => ({
      user: msg.username,
      text: msg.text,
      channel: msg.channel.name,
      timestamp: msg.ts,
      permalink: msg.permalink
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          total: result.messages.total,
          messages
        }, null, 2)
      }]
    };
  }

  case 'get_user_info': {
    const result = await slack.users.info({
      user: args.user_id
    });

    const user = {
      id: result.user.id,
      name: result.user.name,
      real_name: result.user.real_name,
      email: result.user.profile.email,
      title: result.user.profile.title,
      status: result.user.profile.status_text,
      timezone: result.user.tz
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(user, null, 2)
      }]
    };
  }

  case 'list_users': {
    const result = await slack.users.list();

    const users = result.members
      .filter(user => !user.deleted && !user.is_bot)
      .map(user => ({
        id: user.id,
        name: user.name,
        real_name: user.real_name,
        email: user.profile.email,
        title: user.profile.title
      }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(users, null, 2)
      }]
    };
  }

  case 'add_reaction': {
    await slack.reactions.add({
      channel: args.channel_id,
      timestamp: args.timestamp,
      name: args.emoji
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          emoji: args.emoji
        }, null, 2)
      }]
    };
  }

  case 'get_thread_replies': {
    const result = await slack.conversations.replies({
      channel: args.channel_id,
      ts: args.thread_ts
    });

    const replies = result.messages.map(msg => ({
      user: msg.user,
      text: msg.text,
      timestamp: msg.ts
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(replies, null, 2)
      }]
    };
  }

  default:
    throw new Error(`Unknown tool: ${name}`);
}
} catch (error) {
  return {
    content: [{
      type: 'text',
      text: `Error: ${error.message}`
    }],
    isError: true
  };
}
});

// Start server
async function main() {

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Slack MCP Server running on stdio');
}
main().catch(console.error);