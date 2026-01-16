import { Octokit } from 'octokit';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize Octokit with GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Repository details
const owner = 'sourabhm-25';
const repo = 'Smart-Campus';

async function listPullRequests() {
  try {
    console.log(`Fetching pull requests for ${owner}/${repo}...\n`);
    
    // Get all pull requests (open, closed, and merged)
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'all',
      per_page: 100,
      sort: 'updated',
      direction: 'desc'
    });

    if (data.length === 0) {
      console.log('No pull requests found.');
      return;
    }

    console.log(`Found ${data.length} pull request(s):\n`);
    console.log('='.repeat(80));

    data.forEach((pr, index) => {
      console.log(`\n${index + 1}. PR #${pr.number}: ${pr.title}`);
      console.log(`   State: ${pr.state}${pr.merged ? ' (merged)' : ''}`);
      console.log(`   Author: ${pr.user.login}`);
      console.log(`   Created: ${new Date(pr.created_at).toLocaleString()}`);
      console.log(`   Updated: ${new Date(pr.updated_at).toLocaleString()}`);
      if (pr.merged_at) {
        console.log(`   Merged: ${new Date(pr.merged_at).toLocaleString()}`);
      }
      console.log(`   URL: ${pr.html_url}`);
      if (pr.body) {
        const bodyPreview = pr.body.substring(0, 100).replace(/\n/g, ' ');
        console.log(`   Description: ${bodyPreview}${pr.body.length > 100 ? '...' : ''}`);
      }
      console.log('-'.repeat(80));
    });

    // Summary
    const open = data.filter(pr => pr.state === 'open').length;
    const closed = data.filter(pr => pr.state === 'closed' && !pr.merged).length;
    const merged = data.filter(pr => pr.merged).length;

    console.log(`\nSummary:`);
    console.log(`  Open: ${open}`);
    console.log(`  Closed: ${closed}`);
    console.log(`  Merged: ${merged}`);
    console.log(`  Total: ${data.length}`);

  } catch (error) {
    console.error('Error fetching pull requests:', error.message);
    if (error.status === 404) {
      console.error(`Repository ${owner}/${repo} not found or you don't have access to it.`);
    } else if (error.status === 401) {
      console.error('Authentication failed. Please check your GITHUB_TOKEN in .env file.');
    }
    process.exit(1);
  }
}

listPullRequests();
