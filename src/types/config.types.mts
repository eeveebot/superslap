'use strict';

// Rate limit configuration interface
export interface RateLimitConfig {
  mode: 'enqueue' | 'drop';
  level: 'channel' | 'user' | 'global';
  limit: number;
  interval: string; // e.g., "30s", "1m", "5m"
}

// Invulnerable users configuration
export interface InvulnerableUsersConfig {
  users?: string[];
  hostmasks?: string[];
}

// Root configuration interface
export interface SuperslapRootConfig {
  invulnerableUsers?: InvulnerableUsersConfig;
  ratelimits?: {
    slapanus?: RateLimitConfig;
    superslapanus?: RateLimitConfig;
    superslapanusv2?: RateLimitConfig;
    supersuckurdick?: RateLimitConfig;
    superslapaniggasanus?: RateLimitConfig;
    superslapsiesta?: RateLimitConfig;
    superslapbaka?: RateLimitConfig;
  };
}
