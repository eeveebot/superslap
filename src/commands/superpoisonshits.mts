'use strict';

import crypto from 'node:crypto';
import { NatsClient, log, createModuleMetrics, sendChatMessage, queryChannelUsers, NatsSubscriptionResult } from '@eeveebot/libeevee';
import type { SuperslapRootConfig } from '../types/config.types.mjs';
import { isVulnerableUser, sendDelayedMessages, trackTimeout } from '../lib/helpers.mjs';

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

export async function handleSuperpoisonshitsCommand({
  nats,
  commandUUID,
  config,
}: CommandHandlerParams): Promise<NatsSubscriptionResult> {
  const superpoisonshitsCommandSub = nats.subscribe(
    `command.execute.${commandUUID}`,
    async (subject, message) => {
      try {
        const data = JSON.parse(message.string());
        log.info('Received command.execute for superpoisonshits', {
          producer: 'superslap', platform: data.platform, instance: data.instance, channel: data.channel, nick: data.nick,
        });

        if (!isVulnerableUser({ nick: data.nick, ident: '', hostname: data.userHost || '', modes: [] }, config)) {
          void sendChatMessage(nats, { channel: data.channel, network: data.network, instance: data.instance, platform: data.platform, text: "Don't you have a job to do or something?", trace: data.trace }, metrics);
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

        const kickEnabled = config.kick ?? true;
        const kickReason = 'SUPERPOISONSHITSSUPERPOISONSHITSSUPERPOISONSHITSSUPERPOISONSHITSSUPERPOISONSHITSSUPERPOISONSHITS';

        const messages = [
          { delay: 1000, type: 'say' as const, text: `${data.botNick} murmurs a ritual...` },
          { delay: 3000, type: 'say' as const, text: `${requested}'s and ${random}'s names materialize out of turds` },
          { delay: 6000, type: 'say' as const, text: `... ${actual} is cursed with a bleeding anus!` },
        ];

        sendDelayedMessages(messages, data, nats, kickEnabled);

        // Generate 3 random kicks between 6 seconds and 5 hours
        for (let i = 0; i < 3; i++) {
          const delay = Math.floor(Math.random() * 5 * 60 * 60 * 1000 + 6000);
          const timeoutId = setTimeout(() => {
            if (kickEnabled) {
              const kickMsg = {
                action: 'kick',
                data: {
                  channel: data.channel,
                  nick: actual,
                  reason: kickReason,
                },
              };
              const kickTopic = `control.chatConnectors.${data.platform}.${data.instance}`;
              void nats.publish(kickTopic, JSON.stringify(kickMsg));
            } else {
              // Kick disabled — send the reason as a normal message
              void sendChatMessage(nats, {
                channel: data.channel,
                network: data.network,
                instance: data.instance,
                platform: data.platform,
                text: kickReason,
                trace: data.trace,
              }, metrics);
            }
          }, delay);
          trackTimeout(timeoutId);
        }
      } catch (error) {
        log.error('Failed to process superpoisonshits command', { producer: 'superslap', error: error instanceof Error ? error.message : String(error) });
      }
    }
  );

  return superpoisonshitsCommandSub;
}
