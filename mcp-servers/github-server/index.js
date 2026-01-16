import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Octokit } from 'octokit';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize Octokit with GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Create MCP Server
const server = new Server(
  {
    name: 'github-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all available tools
server.setRequestHandler(
  ListToolsRequestSchema,
  async () => {
  return {
    tools: [
      {
        name: 'list_repositories',
        description: 'List repositories for a user or organization',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'GitHub username or organization name'
            },
            type: {
              type: 'string',
              enum: ['all', 'owner', 'member'],
              description: 'Filter by repository type',
              default: 'all'
            }
          },
          required: ['username']
        }
      },
      {
        name: 'list_pull_requests',
        description: 'List pull requests from a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner'
            },
            repo: {
              type: 'string',
              description: 'Repository name'
            },
            state: {
              type: 'string',
              enum: ['open', 'closed', 'all'],
              default: 'open'
            }
          },
          required: ['owner', 'repo']
        }
      },
      {
        name: 'get_pull_request',
        description: 'Get detailed information about a specific pull request',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            pull_number: { type: 'number' }
          },
          required: ['owner', 'repo', 'pull_number']
        }
      },
      {
        name: 'list_issues',
        description: 'List issues from a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            state: {
              type: 'string',
              enum: ['open', 'closed', 'all'],
              default: 'open'
            },
            labels: {
              type: 'string',
              description: 'Comma-separated list of label names'
            }
          },
          required: ['owner', 'repo']
        }
      },
      {
        name: 'get_commits',
        description: 'Get recent commits from a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            per_page: {
              type: 'number',
              description: 'Number of commits to retrieve (max 100)',
              default: 10
            }
          },
          required: ['owner', 'repo']
        }
      },
      {
        name: 'create_issue',
        description: 'Create a new issue in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            title: { type: 'string' },
            body: { type: 'string' },
            labels: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['owner', 'repo', 'title']
        }
      },
      {
        name: 'search_code',
        description: 'Search for code in GitHub repositories',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (e.g., "addClass in:file language:js repo:jquery/jquery")'
            }
          },
          required: ['query']
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
      case 'list_repositories': {
        const { data } = await octokit.rest.repos.listForUser({
          username: args.username,
          type: args.type || 'all',
          per_page: 10,
          sort: 'updated'
        });

        const repos = data.map(repo => ({
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          stars: repo.stargazers_count,
          language: repo.language,
          updated_at: repo.updated_at,
          url: repo.html_url
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(repos, null, 2)
          }]
        };
      }

      case 'list_pull_requests': {
        const { data } = await octokit.rest.pulls.list({
          owner: args.owner,
          repo: args.repo,
          state: args.state || 'open',
          per_page: 10
        });

        const prs = data.map(pr => ({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          author: pr.user.login,
          created_at: pr.created_at,
          updated_at: pr.updated_at,
          url: pr.html_url
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(prs, null, 2)
          }]
        };
      }

      case 'get_pull_request': {
        const { data } = await octokit.rest.pulls.get({
          owner: args.owner,
          repo: args.repo,
          pull_number: args.pull_number
        });

        const prDetails = {
          number: data.number,
          title: data.title,
          body: data.body,
          state: data.state,
          author: data.user.login,
          created_at: data.created_at,
          merged: data.merged,
          mergeable: data.mergeable,
          files_changed: data.changed_files,
          additions: data.additions,
          deletions: data.deletions,
          commits: data.commits,
          url: data.html_url
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(prDetails, null, 2)
          }]
        };
      }

      case 'list_issues': {
        const params = {
          owner: args.owner,
          repo: args.repo,
          state: args.state || 'open',
          per_page: 10
        };

        if (args.labels) {
          params.labels = args.labels;
        }

        const { data } = await octokit.rest.issues.listForRepo(params);

        const issues = data
          .filter(issue => !issue.pull_request) // Exclude PRs
          .map(issue => ({
            number: issue.number,
            title: issue.title,
            state: issue.state,
            author: issue.user.login,
            labels: issue.labels.map(l => l.name),
            created_at: issue.created_at,
            url: issue.html_url
          }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(issues, null, 2)
          }]
        };
      }

      case 'get_commits': {
        const { data } = await octokit.rest.repos.listCommits({
          owner: args.owner,
          repo: args.repo,
          per_page: args.per_page || 10
        });

        const commits = data.map(commit => ({
          sha: commit.sha.substring(0, 7),
          message: commit.commit.message,
          author: commit.commit.author.name,
          date: commit.commit.author.date,
          url: commit.html_url
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(commits, null, 2)
          }]
        };
      }

      case 'create_issue': {
        const params = {
          owner: args.owner,
          repo: args.repo,
          title: args.title,
          body: args.body
        };

        if (args.labels && args.labels.length > 0) {
          params.labels = args.labels;
        }

        const { data } = await octokit.rest.issues.create(params);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              number: data.number,
              title: data.title,
              url: data.html_url,
              state: data.state
            }, null, 2)
          }]
        };
      }

      case 'search_code': {
        const { data } = await octokit.rest.search.code({
          q: args.query,
          per_page: 5
        });

        const results = data.items.map(item => ({
          name: item.name,
          path: item.path,
          repository: item.repository.full_name,
          url: item.html_url
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2)
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
  console.error('GitHub MCP Server running on stdio');
}

main().catch(console.error);