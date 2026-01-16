import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import dotenv from 'dotenv';
dotenv.config();

// Create MCP Server
const server = new Server(
  {
    name: 'docs-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// In-memory document store (replace with database in production)
const documentStore = new Map();

// Helper function to fetch and parse webpage
async function fetchWebpage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return await response.text();
}

// Helper function to extract text from HTML
function extractTextFromHTML(html) {
  const $ = cheerio.load(html);
  
  // Remove script and style elements
  $('script, style, nav, footer, header').remove();
  
  // Get text content
  const title = $('title').text() || $('h1').first().text();
  const mainContent = $('main, article, .content, .documentation').text() || $('body').text();
  
  return {
    title: title.trim(),
    content: mainContent.trim().replace(/\s+/g, ' ').substring(0, 5000)
  };
}

// Define tools
server.setRequestHandler(
  ListToolsRequestSchema,
  async () => {
  return {
    tools: [
      {
        name: 'index_url',
        description: 'Index a documentation URL for searching',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to index'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for categorization'
            }
          },
          required: ['url']
        }
      },
      {
        name: 'search_docs',
        description: 'Search indexed documentation',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by tags'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_document',
        description: 'Get full content of an indexed document',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Document URL'
            }
          },
          required: ['url']
        }
      },
      {
        name: 'list_documents',
        description: 'List all indexed documents',
        inputSchema: {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by tags'
            }
          }
        }
      },
      {
        name: 'add_custom_doc',
        description: 'Add a custom document with title and content',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Document title'
            },
            content: {
              type: 'string',
              description: 'Document content'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for categorization'
            }
          },
          required: ['title', 'content']
        }
      },
      {
        name: 'delete_document',
        description: 'Remove a document from the index',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Document URL or ID to delete'
            }
          },
          required: ['url']
        }
      },
      {
        name: 'fetch_and_search',
        description: 'Fetch a URL and search its content (one-time, without indexing)',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to fetch and search'
            },
            query: {
              type: 'string',
              description: 'Query to search for in the content'
            }
          },
          required: ['url', 'query']
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
      case 'index_url': {
        const html = await fetchWebpage(args.url);
        const { title, content } = extractTextFromHTML(html);

        const doc = {
          url: args.url,
          title,
          content,
          tags: args.tags || [],
          indexed_at: new Date().toISOString()
        };

        documentStore.set(args.url, doc);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              url: args.url,
              title,
              content_length: content.length
            }, null, 2)
          }]
        };
      }

      case 'search_docs': {
        const query = args.query.toLowerCase();
        const results = [];

        for (const [url, doc] of documentStore.entries()) {
          // Filter by tags if provided
          if (args.tags && args.tags.length > 0) {
            const hasMatchingTag = args.tags.some(tag => 
              doc.tags.includes(tag)
            );
            if (!hasMatchingTag) continue;
          }

          // Search in title and content
          const titleMatch = doc.title.toLowerCase().includes(query);
          const contentMatch = doc.content.toLowerCase().includes(query);

          if (titleMatch || contentMatch) {
            // Extract relevant snippet
            const contentLower = doc.content.toLowerCase();
            const queryIndex = contentLower.indexOf(query);
            const snippetStart = Math.max(0, queryIndex - 100);
            const snippetEnd = Math.min(doc.content.length, queryIndex + 200);
            const snippet = doc.content.substring(snippetStart, snippetEnd);

            results.push({
              url: doc.url,
              title: doc.title,
              snippet: '...' + snippet + '...',
              relevance: titleMatch ? 'high' : 'medium',
              tags: doc.tags
            });
          }
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              query: args.query,
              results_count: results.length,
              results: results.slice(0, 10)
            }, null, 2)
          }]
        };
      }

      case 'get_document': {
        const doc = documentStore.get(args.url);

        if (!doc) {
          throw new Error(`Document not found: ${args.url}`);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(doc, null, 2)
          }]
        };
      }

      case 'list_documents': {
        const docs = Array.from(documentStore.values());

        let filtered = docs;
        if (args.tags && args.tags.length > 0) {
          filtered = docs.filter(doc =>
            args.tags.some(tag => doc.tags.includes(tag))
          );
        }

        const summary = filtered.map(doc => ({
          url: doc.url,
          title: doc.title,
          tags: doc.tags,
          indexed_at: doc.indexed_at
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total: filtered.length,
              documents: summary
            }, null, 2)
          }]
        };
      }

      case 'add_custom_doc': {
        const id = `custom-${Date.now()}`;
        const doc = {
          url: id,
          title: args.title,
          content: args.content,
          tags: args.tags || [],
          indexed_at: new Date().toISOString(),
          type: 'custom'
        };

        documentStore.set(id, doc);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              id,
              title: args.title
            }, null, 2)
          }]
        };
      }

      case 'delete_document': {
        const existed = documentStore.delete(args.url);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: existed,
              message: existed ? 'Document deleted' : 'Document not found'
            }, null, 2)
          }]
        };
      }

      case 'fetch_and_search': {
        const html = await fetchWebpage(args.url);
        const { title, content } = extractTextFromHTML(html);

        const query = args.query.toLowerCase();
        const contentLower = content.toLowerCase();
        const found = contentLower.includes(query);

        let snippet = '';
        if (found) {
          const queryIndex = contentLower.indexOf(query);
          const snippetStart = Math.max(0, queryIndex - 150);
          const snippetEnd = Math.min(content.length, queryIndex + 250);
          snippet = content.substring(snippetStart, snippetEnd);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              url: args.url,
              title,
              query: args.query,
              found,
              snippet: found ? '...' + snippet + '...' : 'Query not found in content'
            }, null, 2)
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
  console.error('Documentation MCP Server running on stdio');
}

main().catch(console.error);