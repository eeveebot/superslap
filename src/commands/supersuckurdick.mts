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

export async function handleSupersuckurdickCommand({
  nats,
  commandUUID,
  config,
}: CommandHandlerParams): Promise<NatsSubscriptionResult> {
  const supersuckurdickCommandSub = nats.subscribe(
    `command.execute.${commandUUID}`,
    async (subject, message) => {
      try {
        const data = JSON.parse(message.string());
        log.info('Received command.execute for supersuckurdick', {
          producer: 'superslap', platform: data.platform, instance: data.instance, channel: data.channel, nick: data.nick,
        });

        if (!isVulnerableUser({ nick: data.nick, ident: '', hostname: data.userHost || '', modes: [] }, config)) {
          void sendChatMessage(nats, { channel: data.channel, network: data.network, instance: data.instance, platform: data.platform, text: 'Super suck your own dick', trace: data.trace }, metrics);
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
          { delay: 1000, type: 'say' as const, text: "\x039\x02IT'S \x033S\x038U\x0311P\x034E\x036R\x0312!\x039!\x038 \x039SUCK UR DICK TIME!" },
          { delay: 3000, type: 'say' as const, text: `${data.nick} opens his mouth!` },
          { delay: 6000, type: 'say' as const, text: 'HE TAKES THE LOAD...' },
          { delay: 8000, type: 'say' as const, text: `${target}!` },
          { delay: 12000, type: 'raw' as const, text: `KICK ${data.channel} ${target} :\x033S\x038U\x0311P\x034E\x036R\x0310C\x039O\x038C\x034K\x033S\x038U\x0311P\x034E\x036R\x0310C\x039O\x038C\x034K\x033S\x038U\x0311P\x034E\x036R\x0310C\x039O\x038C\x034K\x033S\x038U\x0311P\x034E\x036R\x0310C\x039O\x038C\x034K\x033S\x038U\x0311P\x034E\x036R\x0310C\x039O\x038C\x034K` },
        ];

        sendDelayedMessages(messages, data, nats);
      } catch (error) {
        log.error('Failed to process supersuckurdick command', { producer: 'superslap', error: error instanceof Error ? error.message : String(error) });
      }
    }
  );

  return supersuckurdickCommandSub;
}
