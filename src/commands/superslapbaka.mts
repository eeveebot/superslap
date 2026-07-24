'use strict';

import { NatsClient, log, createModuleMetrics, sendChatMessage, queryChannelUsers, NatsSubscriptionResult } from '@eeveebot/libeevee';
import type { SuperslapRootConfig } from '../types/config.types.mjs';
import { isVulnerableUser, getRandomTarget, sendDelayedMessages, trackTimeout } from '../lib/helpers.mjs';

const metrics = createModuleMetrics('superslap');

export interface CommandHandlerParams {
  nats: InstanceType<typeof NatsClient>;
  commandUUID: string;
  config: SuperslapRootConfig;
}

export async function handleSuperslapbakaCommand({
  nats,
  commandUUID,
  config,
}: CommandHandlerParams): Promise<NatsSubscriptionResult> {
  const superslapbakaCommandSub = nats.subscribe(
    `command.execute.${commandUUID}`,
    async (subject, message) => {
      try {
        const data = JSON.parse(message.string());
        log.info('Received command.execute for superslapbaka', {
          producer: 'superslap', platform: data.platform, instance: data.instance, channel: data.channel, nick: data.nick,
        });

        if (!isVulnerableUser({ nick: data.nick, ident: '', hostname: data.userHost || '', modes: [] }, config)) {
          void sendChatMessage(nats, { channel: data.channel, network: data.network, instance: data.instance, platform: data.platform, text: 'Anata wa baka desu', trace: data.trace }, metrics);
          return;
        }

        let users: Array<{ nick: string; ident: string; hostname: string; modes: string[] }> = [];
        try {
          users = await queryChannelUsers(nats, data.platform, data.instance, data.channel, { metrics, producer: 'superslap' });
        } catch (error) {
          log.error('Failed to get user list', { producer: 'superslap', error: error instanceof Error ? error.message : String(error) });
          return;
        }

        const filteredUsers = users.filter((user) => user.nick !== data.botNick);
        const target = getRandomTarget(data.nick, data.text, filteredUsers, config, data.botNick);

        const messages = [
          { delay: 1000, type: 'say' as const, text: '\x04\x02Sūpa kōmon tataki no jikandesu!' },
          { delay: 3000, type: 'say' as const, text: `${data.nick} wa yuka ni haku!` },
          { delay: 6000, type: 'say' as const, text: 'Daeki dokusho...' },
          { delay: 8000, type: 'say' as const, text: `${target}!` },
          { delay: 10000, type: 'action' as const, text: `wa SUUPAA!! ${target} no kōmon o tataku!!` },
        ];

        sendDelayedMessages(messages, data, nats, config.kick ?? true);

        // Send kick command (or normal message if kicks are disabled)
        const kickReason = 'SUPAAOSHIRISUPAAOSHIRISUUPAOSHIRISUUPAOSHIRISUUPAOSHIRI';
        const kickEnabled = config.kick ?? true;
        const kickTimeoutId = setTimeout(() => {
          if (kickEnabled) {
            const kickMsg = {
              action: 'kick',
              data: {
                channel: data.channel,
                nick: target,
                reason: kickReason,
              },
            };
            const kickTopic = `control.chatConnectors.${data.platform}.${data.instance}`;
            void nats.publish(kickTopic, JSON.stringify(kickMsg));
          } else {
            void sendChatMessage(nats, {
              channel: data.channel,
              network: data.network,
              instance: data.instance,
              platform: data.platform,
              text: kickReason,
              trace: data.trace,
            }, metrics);
          }
        }, 12000);
        trackTimeout(kickTimeoutId);
      } catch (error) {
        log.error('Failed to process superslapbaka command', { producer: 'superslap', error: error instanceof Error ? error.message : String(error) });
      }
    }
  );

  return superslapbakaCommandSub;
}
