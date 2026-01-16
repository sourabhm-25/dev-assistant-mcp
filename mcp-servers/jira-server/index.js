import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fetch from 'node-fetch';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import dotenv from 'dotenv';
dotenv.config();

// Jira configuration
const JIRA_HOST = process.env.JIRA_HOST; // e.g., 'yourcompany.atlassian.net'
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

// Helper function for Jira API calls
async function jiraRequest(endpoint, method = 'GET', body = null) {
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  
  const options = {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`https://${JIRA_HOST}/rest/api/3/${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jira API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

// Create MCP Server
const server = new Server(
  {
    name: 'jira-mcp-server',
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
        name: 'search_issues',
        description: 'Search for Jira issues using JQL (Jira Query Language)',
        inputSchema: {
          type: 'object',
          properties: {
            jql: {
              type: 'string',
              description: 'JQL query string (e.g., "project = PROJ AND status = Open")'
            },
            max_results: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 10
            }
          },
          required: ['jql']
        }
      },
      {
        name: 'get_issue',
        description: 'Get detailed information about a specific Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            issue_key: {
              type: 'string',
              description: 'Issue key (e.g., "PROJ-123")'
            }
          },
          required: ['issue_key']
        }
      },
      {
        name: 'create_issue',
        description: 'Create a new Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            project_key: {
              type: 'string',
              description: 'Project key (e.g., "PROJ")'
            },
            summary: {
              type: 'string',
              description: 'Issue summary/title'
            },
            description: {
              type: 'string',
              description: 'Issue description'
            },
            issue_type: {
              type: 'string',
              description: 'Issue type (e.g., "Task", "Bug", "Story")',
              default: 'Task'
            },
            priority: {
              type: 'string',
              description: 'Priority (e.g., "High", "Medium", "Low")',
              default: 'Medium'
            }
          },
          required: ['project_key', 'summary', 'issue_type']
        }
      },
      {
        name: 'update_issue',
        description: 'Update an existing Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            issue_key: {
              type: 'string',
              description: 'Issue key to update'
            },
            summary: {
              type: 'string',
              description: 'New summary'
            },
            description: {
              type: 'string',
              description: 'New description'
            },
            status: {
              type: 'string',
              description: 'New status (e.g., "In Progress", "Done")'
            }
          },
          required: ['issue_key']
        }
      },
      {
        name: 'add_comment',
        description: 'Add a comment to a Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            issue_key: {
              type: 'string',
              description: 'Issue key'
            },
            comment: {
              type: 'string',
              description: 'Comment text'
            }
          },
          required: ['issue_key', 'comment']
        }
      },
      {
        name: 'get_sprint_issues',
        description: 'Get issues in a specific sprint',
        inputSchema: {
          type: 'object',
          properties: {
            board_id: {
              type: 'number',
              description: 'Board ID'
            },
            sprint_id: {
              type: 'number',
              description: 'Sprint ID'
            }
          },
          required: ['board_id', 'sprint_id']
        }
      },
      {
        name: 'list_projects',
        description: 'List all accessible Jira projects',
        inputSchema: {
          type: 'object',
          properties: {}
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
      case 'search_issues': {
        const data = await jiraRequest(
          `search?jql=${encodeURIComponent(args.jql)}&maxResults=${args.max_results || 10}`
        );

        const issues = data.issues.map(issue => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status.name,
          assignee: issue.fields.assignee?.displayName || 'Unassigned',
          priority: issue.fields.priority?.name || 'None',
          created: issue.fields.created,
          updated: issue.fields.updated
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ total: data.total, issues }, null, 2)
          }]
        };
      }

      case 'get_issue': {
        const data = await jiraRequest(`issue/${args.issue_key}`);

        const issue = {
          key: data.key,
          summary: data.fields.summary,
          description: data.fields.description,
          status: data.fields.status.name,
          assignee: data.fields.assignee?.displayName || 'Unassigned',
          reporter: data.fields.reporter?.displayName,
          priority: data.fields.priority?.name,
          issue_type: data.fields.issuetype.name,
          created: data.fields.created,
          updated: data.fields.updated,
          comments: data.fields.comment?.comments.map(c => ({
            author: c.author.displayName,
            body: c.body,
            created: c.created
          })) || []
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(issue, null, 2)
          }]
        };
      }

      case 'create_issue': {
        const issueData = {
          fields: {
            project: { key: args.project_key },
            summary: args.summary,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: args.description || ''
                    }
                  ]
                }
              ]
            },
            issuetype: { name: args.issue_type }
          }
        };

        if (args.priority) {
          issueData.fields.priority = { name: args.priority };
        }

        const data = await jiraRequest('issue', 'POST', issueData);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              key: data.key,
              id: data.id,
              url: `https://${JIRA_HOST}/browse/${data.key}`
            }, null, 2)
          }]
        };
      }

      case 'update_issue': {
        const updateData = { fields: {} };

        if (args.summary) updateData.fields.summary = args.summary;
        if (args.description) {
          updateData.fields.description = {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: args.description }]
              }
            ]
          };
        }

        await jiraRequest(`issue/${args.issue_key}`, 'PUT', updateData);

        // Handle status transition separately
        if (args.status) {
          const transitions = await jiraRequest(`issue/${args.issue_key}/transitions`);
          const transition = transitions.transitions.find(
            t => t.name.toLowerCase() === args.status.toLowerCase()
          );

          if (transition) {
            await jiraRequest(
              `issue/${args.issue_key}/transitions`,
              'POST',
              { transition: { id: transition.id } }
            );
          }
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, issue_key: args.issue_key }, null, 2)
          }]
        };
      }

      case 'add_comment': {
        const commentData = {
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: args.comment }]
              }
            ]
          }
        };

        const data = await jiraRequest(
          `issue/${args.issue_key}/comment`,
          'POST',
          commentData
        );

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              comment_id: data.id,
              created: data.created
            }, null, 2)
          }]
        };
      }

      case 'get_sprint_issues': {
        const data = await jiraRequest(
          `board/${args.board_id}/sprint/${args.sprint_id}/issue`
        );

        const issues = data.issues.map(issue => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status.name,
          assignee: issue.fields.assignee?.displayName || 'Unassigned',
          story_points: issue.fields.customfield_10016 || 0
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(issues, null, 2)
          }]
        };
      }

      case 'list_projects': {
        const data = await jiraRequest('project');

        const projects = data.map(project => ({
          key: project.key,
          name: project.name,
          type: project.projectTypeKey,
          lead: project.lead?.displayName
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(projects, null, 2)
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
  console.error('Jira MCP Server running on stdio');
}

main().catch(console.error);