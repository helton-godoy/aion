#!/usr/bin/env node

/**
 * AION GitHub Setup Tool
 * Configures GitHub native integration for AION
 */

require('dotenv').config();
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const { Octokit } = require('@octokit/rest');

class GitHubSetupTool {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.configPath = path.join(projectRoot, '.github', 'aion-config.json');
    this.envPath = path.join(projectRoot, '.env');
  }

  async setup() {
    console.log(
      chalk.cyan(
        chalk.bold('🔗 AION GitHub Native Setup')
      )
    );
    console.log(chalk.gray('Configuring GitHub integration for autonomous development\n'));

    try {
      // Check if already configured
      if (await this.isConfigured()) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: 'GitHub integration already exists. Overwrite configuration?',
            default: false
          }
        ]);

        if (!overwrite) {
          console.log(chalk.yellow('❌ GitHub setup cancelled.'));
          return;
        }
      }

      // Collect configuration
      const config = await this.collectConfiguration();
      
      // Validate configuration
      await this.validateConfiguration(config);
      
      // Save configuration
      await this.saveConfiguration(config);
      
      // Setup GitHub repository
      await this.setupRepository(config);
      
      // Create workflows
      await this.createWorkflows(config);
      
      // Setup webhooks
      await this.setupWebhooks(config);
      
      // Test connection
      await this.testConnection(config);
      
      console.log(chalk.green('\n✨ GitHub Native integration setup complete!'));
      this.displayNextSteps(config);
      
    } catch (error) {
      console.error(chalk.red('\n❌ GitHub setup failed:'), error.message);
      process.exit(1);
    }
  }

  async isConfigured() {
    return await fs.pathExists(this.configPath) && 
           await fs.pathExists(this.envPath);
  }

  async collectConfiguration() {
    console.log(chalk.blue('📋 Collecting GitHub configuration...\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'githubToken',
        message: 'GitHub Personal Access Token:',
        validate: (input) => {
          if (!input || input.length < 40) {
            return 'Token must be at least 40 characters long';
          }
          if (!input.startsWith('ghp_') && !input.startsWith('github_pat_')) {
            return 'Token should start with "ghp_" or "github_pat_"';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'repositoryOwner',
        message: 'Repository Owner (GitHub username or organization):',
        default: 'helton-godoy',
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return 'Repository owner is required';
          }
          if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
            return 'Invalid format (letters, numbers, hyphens, underscores only)';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'repositoryName',
        message: 'Repository Name:',
        default: 'aion',
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return 'Repository name is required';
          }
          if (!/^[a-zA-Z0-9_.-]+$/.test(input)) {
            return 'Invalid format (letters, numbers, dots, hyphens, underscores only)';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'repositoryVisibility',
        message: 'Repository Visibility:',
        choices: [
          { name: 'Public', value: 'public' },
          { name: 'Private', value: 'private' }
        ],
        default: 'private'
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select GitHub features to enable:',
        choices: [
          { name: 'Issues (for requirements tracking)', value: 'issues', checked: true },
          { name: 'Pull Requests (for code review)', value: 'pulls', checked: true },
          { name: 'Actions (for CI/CD)', value: 'actions', checked: true },
          { name: 'Releases (for deployments)', value: 'releases', checked: true },
          { name: 'Projects (for Kanban boards)', value: 'projects', checked: false },
          { name: 'Discussions (for community)', value: 'discussions', checked: false }
        ]
      },
      {
        type: 'list',
        name: 'branchStrategy',
        message: 'Branch Strategy:',
        choices: [
          { name: 'GitFlow (main, develop, feature/*, release/*, hotfix/*)', value: 'gitflow' },
          { name: 'GitHub Flow (main, feature/*)', value: 'github' },
          { name: 'Trunk Based (main only)', value: 'trunk' }
        ],
        default: 'github'
      },
      {
        type: 'confirm',
        name: 'enableAutoMerge',
        message: 'Enable automatic merge for successful PRs?',
        default: false
      },
      {
        type: 'confirm',
        name: 'enableAutoRelease',
        message: 'Enable automatic releases on merge to main?',
        default: true
      }
    ]);

    return answers;
  }

  async validateConfiguration(config) {
    console.log(chalk.blue('\n🔍 Validating GitHub configuration...'));

    const octokit = new Octokit({
      auth: config.githubToken
    });

    try {
      // Test authentication
      const { data: user } = await octokit.rest.users.getAuthenticated();
      console.log(chalk.green(`✅ Authenticated as: ${user.login}`));

      // Test repository access
      try {
        const { data: repo } = await octokit.rest.repos.get({
          owner: config.repositoryOwner,
          repo: config.repositoryName
        });
        console.log(chalk.green(`✅ Repository accessible: ${repo.full_name}`));
        console.log(chalk.gray(`   Visibility: ${repo.private ? 'Private' : 'Public'}`));
      } catch (error) {
        if (error.status === 404) {
          console.log(chalk.yellow(`⚠️  Repository ${config.repositoryOwner}/${config.repositoryName} not found`));
          console.log(chalk.gray('   Will create during setup'));
        } else {
          throw error;
        }
      }

      // Test permissions
      let permissions = { permission: 'admin' }; // Assume admin if repo doesn't exist
      
      try {
        permissions = await octokit.rest.repos.getCollaboratorPermissionLevel({
          owner: config.repositoryOwner,
          repo: config.repositoryName,
          username: user.login
        });
      } catch (error) {
        // Repository doesn't exist, assume admin permissions for creation
        console.log(chalk.gray('   Repository not found, assuming admin permissions for creation'));
      }

      const requiredPerms = ['admin', 'write'];
      if (!requiredPerms.includes(permissions.permission)) {
        throw new Error(`Insufficient permissions: ${permissions.permission} (need: ${requiredPerms.join(' or ')})`);
      }

      console.log(chalk.green(`✅ Permissions sufficient: ${permissions.permission}`));

    } catch (error) {
      throw new Error(`GitHub validation failed: ${error.message}`);
    }
  }

  async saveConfiguration(config) {
    console.log(chalk.blue('\n💾 Saving GitHub configuration...'));

    // Create .github directory
    await fs.ensureDir(path.join(this.projectRoot, '.github'));

    // Save configuration file
    const configData = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      github: {
        owner: config.repositoryOwner,
        repo: config.repositoryName,
        visibility: config.repositoryVisibility,
        features: config.features,
        branchStrategy: config.branchStrategy,
        autoMerge: config.enableAutoMerge,
        autoRelease: config.enableAutoRelease
      },
      aion: {
        integration: 'github-native',
        workflowEngine: 'actions',
        memoryBank: 'issues',
        stateMachine: 'projects',
        safetyProtocol: 'branches'
      }
    };

    await fs.writeJSON(this.configPath, configData, { spaces: 2 });

    // Update .env file
    let envContent = '';
    if (await fs.pathExists(this.envPath)) {
      envContent = await fs.readFile(this.envPath, 'utf8');
    }

    // Add or update GitHub configuration
    const envLines = envContent.split('\n').filter(line => !line.startsWith('GITHUB_'));
    envLines.push(`GITHUB_TOKEN=${config.githubToken}`);
    envLines.push(`GITHUB_OWNER=${config.repositoryOwner}`);
    envLines.push(`GITHUB_REPO=${config.repositoryName}`);

    await fs.writeFile(this.envPath, envLines.join('\n') + '\n');

    console.log(chalk.green('✅ Configuration saved'));
  }

  async setupRepository(config) {
    console.log(chalk.blue('\n🏗️  Setting up GitHub repository...'));

    const octokit = new Octokit({
      auth: config.githubToken
    });

    try {
      // Try to get existing repository
      await octokit.rest.repos.get({
        owner: config.repositoryOwner,
        repo: config.repositoryName
      });

      console.log(chalk.yellow(`⚠️  Repository already exists, updating settings...`));

      // Update repository settings
      await octokit.rest.repos.update({
        owner: config.repositoryOwner,
        repo: config.repositoryName,
        name: config.repositoryName,
        private: config.repositoryVisibility === 'private',
        has_issues: config.features.includes('issues'),
        has_projects: config.features.includes('projects'),
        has_wiki: false, // Disable wiki for AION
        has_downloads: true,
        delete_branch_on_merge: true,
        allow_squash_merge: true,
        allow_merge_commit: false,
        allow_rebase_merge: false
      });

    } catch (error) {
      if (error.status === 404) {
        // Create new repository
        console.log(chalk.blue('Creating new repository...'));
        
        const { data: repo } = await octokit.rest.repos.createForAuthenticatedUser({
          name: config.repositoryName,
          description: 'AION - AI Orchestration Native',
          private: config.repositoryVisibility === 'private',
          has_issues: config.features.includes('issues'),
          has_projects: config.features.includes('projects'),
          has_wiki: false,
          auto_init: true
        });

        console.log(chalk.green(`✅ Repository created: ${repo.html_url}`));
      } else {
        throw error;
      }
    }

    // Setup default branches
    await this.setupBranches(octokit, config);
  }

  async setupBranches(octokit, config) {
    console.log(chalk.blue('🌿 Setting up branch strategy...'));

    const mainBranch = config.branchStrategy === 'gitflow' ? 'main' : 'main';
    
    // Ensure main branch exists and is default
    try {
      await octokit.rest.repos.getBranch({
        owner: config.repositoryOwner,
        repo: config.repositoryName,
        branch: mainBranch
      });
    } catch (error) {
      // Create main branch from initial commit
      const { data: defaultBranch } = await octokit.rest.repos.get({
        owner: config.repositoryOwner,
        repo: config.repositoryName
      });

      if (defaultBranch.default_branch !== mainBranch) {
        await octokit.rest.repos.renameBranch({
          owner: config.repositoryOwner,
          repo: config.repositoryName,
          from: defaultBranch.default_branch,
          to: mainBranch
        });
      }
    }

    // Create develop branch for GitFlow
    if (config.branchStrategy === 'gitflow') {
      try {
        await octokit.rest.git.createRef({
          owner: config.repositoryOwner,
          repo: config.repositoryName,
          ref: 'refs/heads/develop',
          sha: await this.getBranchSHA(octokit, config, mainBranch)
        });
        console.log(chalk.green('✅ Develop branch created'));
      } catch (error) {
        if (error.status !== 422) { // Ignore "ref already exists"
          throw error;
        }
      }
    }

    // Setup branch protection
    if (config.features.includes('pulls')) {
      await this.setupBranchProtection(octokit, config, mainBranch);
    }
  }

  async setupBranchProtection(octokit, config, branch) {
    try {
      await octokit.rest.repos.updateBranchProtection({
        owner: config.repositoryOwner,
        repo: config.repositoryName,
        branch: branch,
        required_status_checks: {
          strict: true,
          contexts: ['AION Tests', 'AION Safety Check']
        },
        enforce_admins: true,
        required_pull_request_reviews: {
          dismissal_restrictions: {},
          dismiss_stale_reviews: true,
          require_code_owner_reviews: true,
          required_approving_review_count: 1
        },
        restrictions: null
      });

      console.log(chalk.green(`✅ Branch protection enabled for ${branch}`));
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not setup branch protection: ${error.message}`));
    }
  }

  async getBranchSHA(octokit, config, branch) {
    const { data: ref } = await octokit.rest.git.getRef({
      owner: config.repositoryOwner,
      repo: config.repositoryName,
      ref: `heads/${branch}`
    });
    return ref.object.sha;
  }

  async createWorkflows(config) {
    console.log(chalk.blue('\n⚙️  Creating GitHub Actions workflows...'));

    const workflowsDir = path.join(this.projectRoot, '.github', 'workflows');
    await fs.ensureDir(workflowsDir);

    // Create AION main workflow
    await this.createAIONWorkflow(workflowsDir, config);
    
    // Create safety check workflow
    await this.createSafetyWorkflow(workflowsDir, config);
    
    // Create release workflow if enabled
    if (config.enableAutoRelease) {
      await this.createReleaseWorkflow(workflowsDir, config);
    }

    console.log(chalk.green('✅ GitHub Actions workflows created'));
  }

  async createAIONWorkflow(workflowsDir, config) {
    const workflow = {
      name: 'AION Autonomous Development',
      on: {
        issues: {
          types: ['opened', 'edited', 'closed']
        },
        pull_request: {
          types: ['opened', 'synchronize', 'closed']
        },
        push: {
          branches: ['main', 'develop']
        }
      },
      jobs: {
        'aion-orchestration': {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              name: 'Checkout code',
              uses: 'actions/checkout@v4'
            },
            {
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v4',
              with: {
                'node-version': '20',
                cache: 'npm'
              }
            },
            {
              name: 'Install dependencies',
              run: 'npm ci'
            },
            {
              name: 'Run AION workflow',
              env: {
                GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
                GITHUB_OWNER: config.repositoryOwner,
                GITHUB_REPO: config.repositoryName
              },
              run: 'npm run aion:workflow:github-full-cycle'
            }
          ]
        }
      }
    };

    await fs.writeJSON(
      path.join(workflowsDir, 'aion-autonomous.yml'),
      workflow,
      { spaces: 2 }
    );
  }

  async createSafetyWorkflow(workflowsDir, config) {
    const workflow = {
      name: 'AION Safety Protocol',
      on: {
        pull_request: {
          types: ['opened', 'synchronize']
        }
      },
      jobs: {
        'safety-check': {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              name: 'Checkout code',
              uses: 'actions/checkout@v4'
            },
            {
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v4',
              with: {
                'node-version': '20',
                cache: 'npm'
              }
            },
            {
              name: 'Install dependencies',
              run: 'npm ci'
            },
            {
              name: 'Run safety validation',
              run: 'npm run aion:safety:validate'
            },
            {
              name: 'Check micro-commits',
              run: 'npm run aion:safety:check-commits'
            }
          ]
        }
      }
    };

    await fs.writeJSON(
      path.join(workflowsDir, 'aion-safety.yml'),
      workflow,
      { spaces: 2 }
    );
  }

  async createReleaseWorkflow(workflowsDir, config) {
    const workflow = {
      name: 'AION Auto Release',
      on: {
        push: {
          branches: ['main']
        }
      },
      jobs: {
        'release': {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              name: 'Checkout code',
              uses: 'actions/checkout@v4',
              with: {
                fetch_depth: 0
              }
            },
            {
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v4',
              with: {
                'node-version': '20',
                cache: 'npm'
              }
            },
            {
              name: 'Install dependencies',
              run: 'npm ci'
            },
            {
              name: 'Run tests',
              run: 'npm test'
            },
            {
              name: 'Create release',
              env: {
                GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}'
              },
              run: 'VERSION=$(node -p "require(\'./package.json\').version"); npm run build; gh release create "v$VERSION" --generate-notes'
            }
          ]
        }
      }
    };

    await fs.writeJSON(
      path.join(workflowsDir, 'aion-release.yml'),
      workflow,
      { spaces: 2 }
    );
  }

  async setupWebhooks(config) {
    console.log(chalk.blue('\n🪝 Setting up webhooks...'));

    // Webhooks are automatically created by GitHub Actions
    // We just need to ensure the repository has the right settings
    
    console.log(chalk.green('✅ Webhooks configured through GitHub Actions'));
  }

  async testConnection(config) {
    console.log(chalk.blue('\n🧪 Testing GitHub integration...'));

    const octokit = new Octokit({
      auth: config.githubToken
    });

    try {
      // Test basic API access
      const { data: repo } = await octokit.rest.repos.get({
        owner: config.repositoryOwner,
        repo: config.repositoryName
      });

      console.log(chalk.green(`✅ Repository access confirmed: ${repo.full_name}`));

      // Test issue creation if enabled
      if (config.features.includes('issues')) {
        const { data: issue } = await octokit.rest.issues.create({
          owner: config.repositoryOwner,
          repo: config.repositoryName,
          title: 'AION Integration Test',
          body: 'This is a test issue to verify AION GitHub integration is working correctly.',
          labels: ['aion-test']
        });

        console.log(chalk.green(`✅ Issue creation test passed: #${issue.number}`));

        // Clean up test issue
        await octokit.rest.issues.update({
          owner: config.repositoryOwner,
          repo: config.repositoryName,
          issue_number: issue.number,
          state: 'closed'
        });
      }

      console.log(chalk.green('✅ All integration tests passed'));

    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  displayNextSteps(config) {
    console.log(chalk.cyan('\n📖 Next Steps:'));
    console.log(chalk.gray('1. Repository is ready for AION autonomous development'));
    console.log(chalk.gray('2. Create your first issue to trigger AION workflow'));
    console.log(chalk.gray('3. Open a pull request to see safety protocol in action'));
    console.log(chalk.gray('4. Push to main branch to trigger auto-release (if enabled)'));
    
    console.log(chalk.cyan('\n🔗 Repository Links:'));
    console.log(chalk.gray(`   Repository: https://github.com/${config.repositoryOwner}/${config.repositoryName}`));
    console.log(chalk.gray(`   Issues: https://github.com/${config.repositoryOwner}/${config.repositoryName}/issues`));
    console.log(chalk.gray(`   Actions: https://github.com/${config.repositoryOwner}/${config.repositoryName}/actions`));
    
    console.log(chalk.cyan('\n🚀 AION Commands:'));
    console.log(chalk.gray('   npm run aion:workflow:github-full-cycle'));
    console.log(chalk.gray('   npm run aion:memory:status'));
    console.log(chalk.gray('   npm run aion:state:reset'));
  }
}

// Run if called directly
if (require.main === module) {
  const tool = new GitHubSetupTool();
  tool.setup().catch(console.error);
}

module.exports = GitHubSetupTool;
