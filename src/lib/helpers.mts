'use strict';

import { NatsClient, sendChatMessage, createModuleMetrics } from '@eeveebot/libeevee';
import type { SuperslapRootConfig } from '../types/config.types.mjs';

const metrics = createModuleMetrics('superslap');

/**
 * Check if a user is vulnerable (not invulnerable according to config).
 */
export function isVulnerableUser(
  user: { nick: string; ident: string; hostname: string; modes: string[] },
  config: SuperslapRootConfig
): boolean {
  // Check if user is in the invulnerable users list
  if (config.invulnerableUsers?.users?.includes(user.nick)) {
    return false;
  }

  // Check if user matches any invulnerable hostmask patterns
  const fullHostmask = `${user.ident}@${user.hostname}`;
  if (config.invulnerableUsers?.hostmasks) {
    for (const hostmaskPattern of config.invulnerableUsers.hostmasks) {
      try {
        const hostmaskRegex = new RegExp(hostmaskPattern);
        if (
          hostmaskRegex.test(user.hostname) ||
          hostmaskRegex.test(fullHostmask)
        ) {
          return false;
        }
      } catch {
        // If regex fails, fall back to exact match
        if (
          hostmaskPattern === user.hostname ||
          hostmaskPattern === fullHostmask
        ) {
          return false;
        }
      }
    }
  }

  // Check if user has operator modes (+o or +O or +a or +q)
  const hasOperatorMode = user.modes.some((mode) =>
    ['o', 'O', 'a', 'q'].includes(mode)
  );
  if (hasOperatorMode) {
    return false;
  }

  // User is vulnerable
  return true;
}

/**
 * Get a random target from the channel user list.
 */
export function getRandomTarget(
  fromUser: string,
  message: string,
  users: Array<{
    nick: string;
    ident: string;
    hostname: string;
    modes: string[];
  }>,
  config: SuperslapRootConfig,
  botNick: string
): string {
  // Filter out invulnerable users and the bot itself
  const vulnerableUsers = users.filter(
    (user) =>
      isVulnerableUser(user, config) &&
      user.nick !== fromUser &&
      user.nick !== botNick
  );

  // If no vulnerable users left, return the sender only if it's not the bot
  if (vulnerableUsers.length === 0) {
    return fromUser !== botNick ? fromUser : botNick;
  }

  // If there's a potential target in the message
  if (message) {
    const messageParts = message.split(' ');
    const action = Math.floor(Math.random() * 3);

    // Attack the target
    if (action === 0) {
      const targetUser = vulnerableUsers.find(
        (user) => user.nick === messageParts[0]
      );
      if (targetUser) {
        return targetUser.nick;
      }
    }
    // Attack the caster (only if it's not the bot)
    else if (action === 1 && fromUser !== botNick) {
      return fromUser;
    }
  }

  // Pick a random vulnerable user
  const index = Math.floor(Math.random() * vulnerableUsers.length);
  return vulnerableUsers[index].nick;
}

/**
 * Send a sequence of delayed messages (say, action, or raw kick commands).
 */
export function sendDelayedMessages(
  messages: Array<{
    delay: number;
    type: 'say' | 'action' | 'raw';
    text: string;
  }>,
  data: Record<string, unknown>,
  nats: InstanceType<typeof NatsClient>
): void {
  messages.forEach(({ delay, type, text }) => {
    setTimeout(() => {
      // Handle raw messages differently (for kick commands)
      if (type === 'raw') {
        if (text.startsWith('KICK ')) {
          const parts = text.split(' ');
          if (parts.length >= 3) {
            const channel = parts[1];
            const target = parts[2];
            const reason = parts.slice(3).join(' ').substring(1);

            const kickMsg = {
              action: 'kick',
              data: {
                channel: channel,
                nick: target,
                reason: reason,
              },
            };

            const kickTopic = `control.chatConnectors.${data['platform']}.${data['instance']}`;
            void nats.publish(kickTopic, JSON.stringify(kickMsg));
          }
        }
        return;
      }

      void sendChatMessage(nats, {
        channel: data['channel'] as string,
        network: data['network'] as string,
        instance: data['instance'] as string,
        platform: data['platform'] as string,
        text: text,
        trace: data['trace'] as string,
      }, metrics, type === 'action' ? 'action.outgoing' : 'message.outgoing');
    }, delay);
  });
}
