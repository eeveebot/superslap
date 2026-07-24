'use strict';

import { NatsClient, log, createModuleMetrics, queryChannelUsers, NatsSubscriptionResult } from '@eeveebot/libeevee';
import type { SuperslapRootConfig } from '../types/config.types.mjs';
import { getRandomTarget, sendDelayedMessages } from '../lib/helpers.mjs';

const metrics = createModuleMetrics('superslap');

export interface CommandHandlerParams {
  nats: InstanceType<typeof NatsClient>;
  commandUUID: string;
  config: SuperslapRootConfig;
}

export async function handleSuperslapanusCommand({
  nats,
  commandUUID,
  config,
}: CommandHandlerParams): Promise<NatsSubscriptionResult> {
  const superslapanusCommandSub = nats.subscribe(
    `command.execute.${commandUUID}`,
    async (subject, message) => {
      try {
        const data = JSON.parse(message.string());
        log.info('Received command.execute for superslapanus', {
          producer: 'superslap',
          platform: data.platform,
          instance: data.instance,
          channel: data.channel,
          nick: data.nick,
        });

        let users: Array<{
          nick: string; ident: string; hostname: string; modes: string[];
        }> = [];
        try {
          users = await queryChannelUsers(nats, data.platform, data.instance, data.channel, { metrics, producer: 'superslap' });
        } catch (error) {
          log.error('Failed to get user list', { producer: 'superslap', error: error instanceof Error ? error.message : String(error) });
          return;
        }

        const filteredUsers = users.filter((user) => user.nick !== data.botNick);
        const target = getRandomTarget(data.nick, data.text, filteredUsers, config, data.botNick);

        const messages = [
          { delay: 1000, type: 'say' as const, text: "\x034\x02IT'S \x033S\x038U\x0311P\x034E\x036R\x0312!\x039!\x038 \x034ANUS SLAPPING TIME!" },
          { delay: 3000, type: 'say' as const, text: `${data.botNick} spits onto the floor!` },
          { delay: 6000, type: 'say' as const, text: 'The saliva reads...' },
          { delay: 8000, type: 'say' as const, text: `${target}!` },
          { delay: 10000, type: 'action' as const, text: `\x02\x033S\x038U\x0311P\x034E\x036R\x0312!\x039!\x038\x03 slaps ${target}'s anus!!` },
          { delay: 12000, type: 'raw' as const, text: `KICK ${data.channel} ${target} :\x033S\x038U\x0311P\x034E\x036R\x0310A\x039N\x038A\x034L\x033S\x038U\x0311P\x034E\x036R\x0310A\x039N\x038A\x034L\x033S\x038U\x0311P\x034E\x036R\x0310A\x039N\x038A\x034L\x033S\x038U\x0311P\x034E\x036R\x0310A\x039N\x038A\x034L` },
        ];

        sendDelayedMessages(messages, data, nats, config.kick ?? true);
      } catch (error) {
        log.error('Failed to process superslapanus command', { producer: 'superslap', error: error instanceof Error ? error.message : String(error) });
      }
    }
  );

  return superslapanusCommandSub;
}
