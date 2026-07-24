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

export async function handleSuperslapaniggasanusCommand({
  nats,
  commandUUID,
  config,
}: CommandHandlerParams): Promise<NatsSubscriptionResult> {
  const superslapaniggasanusCommandSub = nats.subscribe(
    `command.execute.${commandUUID}`,
    async (subject, message) => {
      try {
        const data = JSON.parse(message.string());
        log.info('Received command.execute for superslapaniggasanus', {
          producer: 'superslap', platform: data.platform, instance: data.instance, channel: data.channel, nick: data.nick,
        });

        if (!isVulnerableUser({ nick: data.nick, ident: '', hostname: data.userHost || '', modes: [] }, config)) {
          void sendChatMessage(nats, { channel: data.channel, network: data.network, instance: data.instance, platform: data.platform, text: 'Fuck da police', trace: data.trace }, metrics);
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
          { delay: 1000, type: 'say' as const, text: "\x031\x02IT'S SUPER SLAP A NIGGAS ANUS TIME!!!" },
          { delay: 3000, type: 'say' as const, text: `This nigga ${data.botNick} \x02GETS BUCK\x02!` },
          { delay: 6000, type: 'say' as const, text: 'What it do ...? ' },
          { delay: 8000, type: 'say' as const, text: `${target}!` },
          { delay: 10000, type: 'action' as const, text: `\x02 \x031\x02SUPER SLAPS ${target}'s BLACK ANUS!` },
          { delay: 20000, type: 'raw' as const, text: `KICK ${data.channel} ${target} :\x031THISNIGGASDOWNTHISNIGGASDOWNTHISNIGGASDOWNTHISNIGGASDOWNTHISNIGGASDOWNTHISNIGGASDOWN` },
        ];

        sendDelayedMessages(messages, data, nats, config.kick ?? true);
      } catch (error) {
        log.error('Failed to process superslapaniggasanus command', { producer: 'superslap', error: error instanceof Error ? error.message : String(error) });
      }
    }
  );

  return superslapaniggasanusCommandSub;
}
