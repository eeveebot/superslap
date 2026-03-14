'use strict';

import fs from 'node:fs';
import yaml from 'js-yaml';
import { log } from '@eeveebot/libeevee';
import { SuperslapRootConfig } from '../types/config.types.mjs';

const SUPERSLAP_CONFIG_ENV_VAR = 'MODULE_CONFIG_PATH';

/**
 * Load superslap configuration from YAML file
 * @returns SuperslapRootConfig parsed from YAML file
 */
export async function loadSuperslapConfig(): Promise<SuperslapRootConfig> {
  // Get the config file path from environment variable
  const configPath = process.env[SUPERSLAP_CONFIG_ENV_VAR];
  if (!configPath) {
    const msg = `Environment variable ${SUPERSLAP_CONFIG_ENV_VAR} is not set. Using default configuration.`;
    log.warn(msg, { producer: 'superslap' });

    // Return default configuration
    return {
      invulnerableUsers: {
        users: ['admin', 'moderator'],
        hostmasks: [],
      },
      ratelimits: {},
    };
  }

  try {
    // Read the YAML file
    const configFile = fs.readFileSync(configPath, 'utf8');

    // Parse the YAML content
    const config = yaml.load(configFile) as SuperslapRootConfig;

    // Provide defaults for missing sections
    if (!config.invulnerableUsers) {
      config.invulnerableUsers = {
        users: ['admin', 'moderator'],
        hostmasks: [],
      };
    } else {
      if (!config.invulnerableUsers.users) {
        config.invulnerableUsers.users = ['admin', 'moderator'];
      }
      if (!config.invulnerableUsers.hostmasks) {
        config.invulnerableUsers.hostmasks = [];
      }
    }

    log.info('Loaded superslap configuration', {
      producer: 'superslap',
      configPath,
      invulnerableUserCount: config.invulnerableUsers.users?.length || 0,
      invulnerableHostmaskCount:
        config.invulnerableUsers.hostmasks?.length || 0,
    });

    return config;
  } catch (error) {
    log.error('Failed to load superslap configuration, using defaults', {
      producer: 'superslap',
      configPath,
      error: error instanceof Error ? error.message : String(error),
    });

    // Return default configuration if loading fails
    return {
      invulnerableUsers: {
        users: ['admin', 'moderator'],
        hostmasks: [],
      },
      ratelimits: {},
    };
  }
}
