#!/usr/bin/env node

/**
 * AION Memory Status Tool
 * Shows Memory Bank status and statistics
 */

const path = require('path');
const chalk = require('chalk');
const MemoryManager = require('../../src/modules/aion/memory/memory-manager');

class MemoryStatusTool {
  constructor() {
    this.projectRoot = process.cwd();
    this.memoryManager = new MemoryManager(this.projectRoot);
  }

  async showStatus() {
    console.log(
      chalk.cyan(
        chalk.bold('🧠 AION Memory Bank Status')
      )
    );
    console.log(chalk.gray('Checking Memory Bank status...\n'));

    try {
      const status = await this.memoryManager.getStatus();
      const context = await this.memoryManager.getContext();
      
      this.displayStatus(status);
      this.displayContext(context);
      this.displayRecommendations(status);
      
    } catch (error) {
      console.error(chalk.red('\n❌ Failed to get Memory Bank status:'), error.message);
      process.exit(1);
    }
  }

  displayStatus(status) {
    console.log(chalk.blue('📊 Memory Bank Status:'));
    
    // Product Context
    console.log(chalk.yellow('\nProduct Context:'));
    console.log(`  Exists: ${status.productContext.exists ? chalk.green('✅') : chalk.red('❌')}`);
    console.log(`  Size: ${status.productContext.size} bytes`);
    console.log(`  Artifacts: ${status.productContext.artifacts}`);
    
    // Active Context
    console.log(chalk.yellow('\nActive Context:'));
    console.log(`  Exists: ${status.activeContext.exists ? chalk.green('✅') : chalk.red('❌')}`);
    console.log(`  Size: ${status.activeContext.size} bytes`);
    console.log(`  Active Personas: ${status.activeContext.activePersonas}`);
    
    // Overall
    console.log(chalk.yellow('\nOverall:'));
    console.log(`  Total Artifacts: ${status.totalArtifacts}`);
    console.log(`  Last Activity: ${status.lastActivity || 'Never'}`);
  }

  displayContext(context) {
    console.log(chalk.blue('\n📝 Context Summary:'));
    
    // Product context
    if (context.product && context.product.metadata) {
      console.log(chalk.yellow('\nProduct Context:'));
      console.log(`  Project: ${context.product.metadata.project || 'Unknown'}`);
      console.log(`  Description: ${context.product.metadata.description || 'No description'}`);
      console.log(`  Version: ${context.product.metadata.version || 'Unknown'}`);
    }
    
    // Active context
    if (context.active && context.active.session) {
      console.log(chalk.yellow('\nActive Session:'));
      console.log(`  Phase: ${context.active.session.phase || 'Unknown'}`);
      console.log(`  Active Agent: ${context.active.session.activePersona || 'None'}`);
      console.log(`  Started: ${context.active.session.startedAt || 'Unknown'}`);
    }
    
    // Active personas
    if (context.combined && context.combined.personas) {
      const personas = Object.keys(context.combined.personas);
      if (personas.length > 0) {
        console.log(chalk.yellow('\nActive Personas:'));
        personas.forEach(persona => {
          const data = context.combined.personas[persona];
          console.log(`  ${persona}: ${data.status || 'Unknown status'}`);
        });
      }
    }
  }

  displayRecommendations(status) {
    console.log(chalk.blue('\n💡 Recommendations:'));
    
    const recommendations = [];
    
    if (!status.productContext.exists) {
      recommendations.push('Initialize product context with project information');
    }
    
    if (!status.activeContext.exists) {
      recommendations.push('Initialize active context for session tracking');
    }
    
    if (status.totalArtifacts === 0) {
      recommendations.push('Start development workflow to generate artifacts');
    }
    
    if (status.activeContext.activePersonas === 0) {
      recommendations.push('Activate an agent to begin autonomous development');
    }
    
    if (recommendations.length === 0) {
      console.log(chalk.green('  ✅ Memory Bank is properly configured and active'));
    } else {
      recommendations.forEach(rec => {
        console.log(chalk.yellow(`  • ${rec}`));
      });
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tool = new MemoryStatusTool();
  tool.showStatus().catch(console.error);
}

module.exports = MemoryStatusTool;
