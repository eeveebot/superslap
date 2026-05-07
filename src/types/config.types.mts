'use strict';

import { RateLimitConfig } from '@eeveebot/libeevee';

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
