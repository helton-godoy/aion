/**
 * AION Memory Manager
 * Manages persistent context across sessions
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class MemoryManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.productContextPath = path.join(projectRoot, 'productContext.md');
    this.activeContextPath = path.join(projectRoot, 'activeContext.md');
  }

  /**
   * Update context with new artifacts from a persona
   */
  async updateContext(persona, artifacts) {
    console.log(chalk.blue(`📝 Updating context for ${persona}...`));
    
    try {
      // Load current contexts
      const activeContext = await this.loadActiveContext();
      
      // Update active context with new artifacts
      const updatedContext = this.mergeArtifacts(activeContext, persona, artifacts);
      
      // Save updated context
      await this.saveActiveContext(updatedContext);
      
      // Merge into product context if significant
      if (this.isSignificantUpdate(artifacts)) {
        await this.mergeIntoProductContext(artifacts);
      }
      
      console.log(chalk.green(`✅ Context updated for ${persona}`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to update context: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get complete context (product + active)
   */
  async getContext() {
    try {
      const [product, active] = await Promise.all([
        this.loadProductContext(),
        this.loadActiveContext()
      ]);
      
      return {
        product,
        active,
        combined: this.mergeContexts(product, active)
      };
    } catch (error) {
      console.error(chalk.red(`❌ Failed to load context: ${error.message}`));
      return { product: {}, active: {}, combined: {} };
    }
  }

  /**
   * Load product context
   */
  async loadProductContext() {
    try {
      // BOLT OPTIMIZATION: Avoid double I/O. Instead of checking pathExists then reading,
      // just try reading and handle ENOENT.
      const content = await fs.readFile(this.productContextPath, 'utf8');
      return this.parseMarkdownContent(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return this.getDefaultProductContext();
      }
      console.warn(chalk.yellow(`⚠️  Could not load product context: ${error.message}`));
      return this.getDefaultProductContext();
    }
  }

  /**
   * Load active context
   */
  async loadActiveContext() {
    try {
      // BOLT OPTIMIZATION: Avoid double I/O. Instead of checking pathExists then reading,
      // just try reading and handle ENOENT.
      const content = await fs.readFile(this.activeContextPath, 'utf8');
      return this.parseMarkdownContent(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return this.getDefaultActiveContext();
      }
      console.warn(chalk.yellow(`⚠️  Could not load active context: ${error.message}`));
      return this.getDefaultActiveContext();
    }
  }

  /**
   * Save active context
   */
  async saveActiveContext(context) {
    const content = this.formatContextAsMarkdown(context);
    await fs.writeFile(this.activeContextPath, content, 'utf8');
  }

  /**
   * Merge artifacts into context
   */
  mergeArtifacts(context, persona, artifacts) {
    const updated = { ...context };
    
    // Add persona section if not exists
    if (!updated.personas) {
      updated.personas = {};
    }
    
    // Update persona artifacts
    updated.personas[persona] = {
      lastUpdated: new Date().toISOString(),
      artifacts: artifacts,
      status: 'active'
    };
    
    // Update session info
    updated.session = {
      ...updated.session,
      lastActivity: new Date().toISOString(),
      activePersona: persona
    };
    
    return updated;
  }

  /**
   * Check if update is significant enough for product context
   */
  isSignificantUpdate(artifacts) {
    // Significant if contains major deliverables
    const significantTypes = ['PRD', 'TECH_SPEC', 'IMPLEMENTATION', 'RELEASE'];
    return artifacts.some(artifact => 
      significantTypes.some(type => artifact.type?.includes(type))
    );
  }

  /**
   * Merge into product context
   */
  async mergeIntoProductContext(artifacts) {
    console.log(chalk.blue('🔄 Merging into product context...'));
    
    const productContext = await this.loadProductContext();
    
    // Add significant artifacts to product context
    if (!productContext.artifacts) {
      productContext.artifacts = [];
    }
    
    artifacts.forEach(artifact => {
      productContext.artifacts.push({
        ...artifact,
        addedAt: new Date().toISOString()
      });
    });
    
    // Save product context
    const content = this.formatContextAsMarkdown(productContext);
    await fs.writeFile(this.productContextPath, content, 'utf8');
    
    console.log(chalk.green('✅ Product context updated'));
  }

  /**
   * Parse markdown content into structured data
   */
  parseMarkdownContent(content) {
    const context = {
      metadata: {},
      sections: {},
      personas: {},
      artifacts: []
    };
    
    const lines = content.split('\n');
    let currentSection = null;
    let currentPersona = null;
    
    for (const line of lines) {
      // Parse headers
      if (line.startsWith('# ')) {
        currentSection = line.substring(2).trim();
        context.sections[currentSection] = [];
        continue;
      }
      
      // Parse metadata
      if (line.includes('**') && line.includes(':')) {
        const match = line.match(/\*\*(.+?)\*\*:\s*(.+)/);
        if (match) {
          context.metadata[match[1].toLowerCase().replace(/\s+/g, '_')] = match[2].trim();
        }
        continue;
      }
      
      // Store content in current section
      if (currentSection && line.trim()) {
        context.sections[currentSection].push(line.trim());
      }
    }
    
    return context;
  }

  /**
   * Format context as markdown
   */
  formatContextAsMarkdown(context) {
    let markdown = '';
    
    // Header
    markdown += '# Active Context - AION\n\n';
    
    // Metadata
    if (context.session) {
      markdown += `**Session Started:** ${context.session.startedAt || new Date().toISOString()}\n`;
      markdown += `**Current Phase:** ${context.session.phase || 'Unknown'}\n`;
      markdown += `**Active Agent:** ${context.session.activePersona || 'None'}\n\n`;
    }
    
    // Current State
    markdown += '## Current State\n\n';
    if (context.session?.currentState) {
      markdown += `${context.session.currentState}\n\n`;
    }
    
    // Personas
    if (context.personas && Object.keys(context.personas).length > 0) {
      markdown += '## Active Personas\n\n';
      for (const [persona, data] of Object.entries(context.personas)) {
        markdown += `### ${persona}\n`;
        markdown += `**Last Updated:** ${data.lastUpdated}\n`;
        markdown += `**Status:** ${data.status}\n`;
        if (data.artifacts && data.artifacts.length > 0) {
          markdown += '**Artifacts:**\n';
          data.artifacts.forEach(artifact => {
            markdown += `- ${artifact.type || 'Unknown'}: ${artifact.description || 'No description'}\n`;
          });
        }
        markdown += '\n';
      }
    }
    
    return markdown;
  }

  /**
   * Merge product and active contexts
   */
  mergeContexts(product, active) {
    return {
      ...product,
      ...active,
      personas: {
        ...product.personas,
        ...active.personas
      },
      artifacts: [
        ...(product.artifacts || []),
        ...(active.artifacts || [])
      ]
    };
  }

  /**
   * Get default product context
   */
  getDefaultProductContext() {
    return {
      metadata: {
        project: 'AION',
        description: 'AI Orchestration Native',
        version: '1.0.0-alpha.1'
      },
      sections: {
        'Project Overview': [
          'AION represents the fusion of BMAD-METHOD\'s robust infrastructure with BMAD-GITHUB-NATIVE-FULL-CYCLE\'s orchestration philosophy.'
        ]
      },
      artifacts: []
    };
  }

  /**
   * Get default active context
   */
  getDefaultActiveContext() {
    return {
      session: {
        startedAt: new Date().toISOString(),
        phase: 'Initialization',
        activePersona: 'None',
        currentState: 'Setting up AION autonomous development system'
      },
      personas: {},
      artifacts: []
    };
  }

  /**
   * Get memory bank status
   */
  async getStatus() {
    const context = await this.getContext();
    
    // BOLT OPTIMIZATION: Consolidate pathExists and stat into a single stat call.
    // stat throws ENOENT if it doesn't exist, reducing I/O operations from up to 3 to 1 per file.
    const getFileStats = async (filePath) => {
      try {
        const stats = await fs.stat(filePath);
        return { exists: true, size: stats.size };
      } catch (error) {
        return { exists: false, size: 0 };
      }
    };

    const [productStats, activeStats] = await Promise.all([
      getFileStats(this.productContextPath),
      getFileStats(this.activeContextPath)
    ]);

    return {
      productContext: {
        exists: productStats.exists,
        size: productStats.size,
        artifacts: context.product.artifacts?.length || 0
      },
      activeContext: {
        exists: activeStats.exists,
        size: activeStats.size,
        activePersonas: Object.keys(context.active.personas || {}).length
      },
      totalArtifacts: context.combined.artifacts?.length || 0,
      lastActivity: context.active.session?.lastActivity || null
    };
  }
}

module.exports = MemoryManager;
