'use strict';

import { NatsClient, log, createModuleMetrics, sendChatMessage, queryChannelUsers, NatsSubscriptionResult } from '@eeveebot/libeevee';
import type { SuperslapRootConfig } from '../types/config.types.mjs';
import { isVulnerableUser, getRandomTarget, sendDelayedMessages } from '../lib/helpers.mjs';

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
          producer: 'superslap', platform: data.platform, instance: data.instance, channel: data.channel, user: data.user,
        });

        if (!isVulnerableUser({ nick: data.user, ident: '', hostname: data.userHost || '', modes: [] }, config)) {
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
        const target = getRandomTarget(data.user, data.text, filteredUsers, config, data.botNick);

        const messages = [
          { delay: 1000, type: 'say' as const, text: '\x04\x02Sūpa kōmon tataki no jikandesu!' },
          { delay: 3000, type: 'say' as const, text: `${data.user} wa yuka ni haku!` },
          { delay: 6000, type: 'say' as const, text: 'Daeki dokusho...' },
          { delay: 8000, type: 'say' as const, text: `${target}!` },
          { delay: 10000, type: 'action' as const, text: `wa SUUPAA!! ${target} no kōmon o tataku!!` },
        ];

        sendDelayedMessages(messages, data, nats);

        // Send kick command
        setTimeout(() => {
          const kickMsg = {
            action: 'kick',
            data: {
              channel: data.channel,
              nick: target,
              reason: 'SUPAAOSHIRISUPAAOSHIRISUUPAOSHIRISUUPAOSHIRISUUPAOSHIRI',
            },
          };
          const kickTopic = `control.chatConnectors.${data.platform}.${data.instance}`;
          void nats.publish(kickTopic, JSON.stringify(kickMsg));
        }, 12000);
      } catch (error) {
        log.error('Failed to process superslapbaka command', { producer: 'superslap', error: error instanceof Error ? error.message : String(error) });
      }
    }
  );

  return superslapbakaCommandSub;
}
