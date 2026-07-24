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

export async function handleSuperslapanusv2Command({
  nats,
  commandUUID,
  config,
}: CommandHandlerParams): Promise<NatsSubscriptionResult> {
  const superslapanusv2CommandSub = nats.subscribe(
    `command.execute.${commandUUID}`,
    async (subject, message) => {
      try {
        const data = JSON.parse(message.string());
        log.info('Received command.execute for superslapanusv2', {
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

        const filteredUsers = users.filter((user) => user.nick !== data.botNick);
        const target = getRandomTarget(data.nick, data.text, filteredUsers, config, data.botNick);

        const messages = [
          { delay: 1000, type: 'say' as const, text: '\x036,4I\x0313,07T\x0312,08S\x033,09 \x038,12S\x037,13U\x034,06P\x036,04E\x0313,07R\x0312,08 \x033,09S\x038,12L\x037,13A\x034,06P\x036,04 \x0313,07A\x0312,08N\x033,09U\x038,12S\x037,13 \x034,06v\x036,042\x0313,07 \x0312,08!\x033,09!\x038,12!\x037,13!\x034,06!\x036,04!\x0313,07!\x0312,08!\x033,09!' },
          { delay: 3000, type: 'say' as const, text: `${data.botNick} spits onto the floor!` },
          { delay: 6000, type: 'say' as const, text: 'The saliva reads...' },
          { delay: 8000, type: 'say' as const, text: `${target}!` },
          { delay: 10000, type: 'action' as const, text: `\x02 \x036,4S\x0313,07U\x0312,08P\x033,09E\x038,12R\x03 slaps ${target}'s anus!!!!` },
          { delay: 12000, type: 'raw' as const, text: `KICK ${data.channel} ${target} :\x036,4S\x0313,07U\x0312,08P\x033,09E\x038,12R\x037,13A\x034,06N\x036,04A\x0313,07L\x0312,08S\x033,09U\x038,12P\x037,13E\x034,06R\x036,04A\x0313,07N\x0312,08A\x033,09L\x038,12S\x037,13U\x034,06P\x036,04E\x0313,07R\x0312,08A\x033,09N\x038,12A\x037,13L\x034,06S\x036,04U\x0313,07P\x0312,08E\x033,09R\x038,12A\x037,13N\x034,06A\x036,04L\x0313,07S\x0312,08U\x033,09P\x038,12E\x037,13R\x034,06A\x036,04N\x0313,07A\x0312,08L\x033,09S\x038,12U\x037,13P\x034,06E\x036,04R\x0313,07A\x0312,08N\x033,09A\x038,12L` },
        ];

        sendDelayedMessages(messages, data, nats);
      } catch (error) {
        log.error('Failed to process superslapanusv2 command', { producer: 'superslap', error: error instanceof Error ? error.message : String(error) });
      }
    }
  );

  return superslapanusv2CommandSub;
}
