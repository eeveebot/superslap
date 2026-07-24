'use strict';

import crypto from 'node:crypto';
import { NatsClient, log, createModuleMetrics, sendChatMessage, queryChannelUsers, NatsSubscriptionResult } from '@eeveebot/libeevee';
import type { SuperslapRootConfig } from '../types/config.types.mjs';
import { isVulnerableUser, sendDelayedMessages } from '../lib/helpers.mjs';

const metrics = createModuleMetrics('superslap');

export interface CommandHandlerParams {
  nats: InstanceType<typeof NatsClient>;
  commandUUID: string;
  config: SuperslapRootConfig;
}

/**
 * Pick a random element from an array using crypto-secure RNG.
 */
function cryptoRandomIndex(length: number): number {
  return crypto.randomBytes(1).readUInt8(0) % length;
}

export async function handlePoisonshitsCommand({
  nats,
  commandUUID,
  config,
}: CommandHandlerParams): Promise<NatsSubscriptionResult> {
  const poisonshitsCommandSub = nats.subscribe(
    `command.execute.${commandUUID}`,
    async (subject, message) => {
      try {
        const data = JSON.parse(message.string());
        log.info('Received command.execute for poisonshits', {
          producer: 'superslap', platform: data.platform, instance: data.instance, channel: data.channel, nick: data.nick,
        });

        if (!isVulnerableUser({ nick: data.nick, ident: '', hostname: data.userHost || '', modes: [] }, config)) {
          void sendChatMessage(nats, { channel: data.channel, network: data.network, instance: data.instance, platform: data.platform, text: 'You clearly take your moderation duties very seriously', trace: data.trace }, metrics);
          return;
        }

        let users: Array<{ nick: string; ident: string; hostname: string; modes: string[] }> = [];
        try {
          users = await queryChannelUsers(nats, data.platform, data.instance, data.channel, { metrics, producer: 'superslap' });
        } catch (error) {
          log.error('Failed to get user list', { producer: 'superslap', error: error instanceof Error ? error.message : String(error) });
          return;
        }

        // Filter out the bot
        const channelUsers = users.filter((user) => user.nick !== data.botNick);
        if (channelUsers.length === 0) {
          return;
        }

        // Pick 3 candidates: requested target, random user, and the caster
        const messageParts = (data.text || '').split(' ').filter((p: string) => p.length > 0);
        let requested = messageParts[0];
        if (!requested) {
          // No target specified — pick a random one
          requested = channelUsers[cryptoRandomIndex(channelUsers.length)].nick;
        }

        // Pick a random user that isn't the requested target
        const randomPool = channelUsers.filter((user) => user.nick !== requested);
        const random = randomPool.length > 0
          ? randomPool[cryptoRandomIndex(randomPool.length)].nick
          : channelUsers[cryptoRandomIndex(channelUsers.length)].nick;

        // Pick the actual target at random from the 3 candidates
        const candidates = [requested, random, data.nick];
        const actual = candidates[cryptoRandomIndex(candidates.length)];

        const messages = [
          { delay: 1000, type: 'say' as const, text: `${data.botNick} murmurs a ritual...` },
          { delay: 3000, type: 'say' as const, text: `${requested}'s and ${random}'s names materialize out of turds` },
          { delay: 6000, type: 'say' as const, text: `... ${actual}!` },
          { delay: 8000, type: 'raw' as const, text: `KICK ${data.channel} ${actual} :POISONSHITSPOISONSHITSPOISONSHITSPOISONSHITSPOISONSHITSPOISONSHITS` },
        ];

        sendDelayedMessages(messages, data, nats, config.kick ?? true);
      } catch (error) {
        log.error('Failed to process poisonshits command', { producer: 'superslap', error: error instanceof Error ? error.message : String(error) });
      }
    }
  );

  return poisonshitsCommandSub;
}
