'use strict';

import { NatsClient, log, createModuleMetrics, sendChatMessage, queryChannelUsers, NatsSubscriptionResult } from '@eeveebot/libeevee';
import type { SuperslapRootConfig } from '../types/config.types.mjs';
import { isVulnerableUser, getRandomTarget, sendDelayedMessages } from '../lib/helpers.mjs';

const metrics = createModuleMetrics('superslap');

// Spanish slap messages
const spanishSlaps = [
  '\x0311¡\x0302S\x0312Ú\x0306P\x0313E\x0305R \x0304B\x0307O\x0308F\x0303E\x0309T\x0310A\x0311D\x0302A \x0312A\x0306N\x0313O \x0305N\x0304O \x0307M\x0308Á\x0303S \x0309L\x0310E\x0311C\x0302H\x0312E \x0306M\x0313A\x0305T\x0304E\x0307R\x0308N\x0303A\x0309!',
  '\x0310¡\x0311S\x0302Ú\x0312P\x0306E\x0313R \x0305B\x0304O\x0307F\x0308E\x0303T\x0309A\x0310D\x0311A \x0302A\x0312N\x0306O \x0313N\x0305O \x0304M\x0307Á\x0308S \x0303L\x0309E\x0310C\x0311H\x0302E \x0312M\x0306A\x0313T\x0305E\x0304R\x0307N\x0308A\x0303!',
  '\x0309¡\x0310S\x0311Ú\x0302P\x0312E\x0306R \x0313B\x0305O\x0304F\x0307E\x0308T\x0303A\x0309D\x0310A \x0311A\x0302N\x0312O \x0306N\x0313O \x0305M\x0304Á\x0307S \x0308L\x0303E\x0309C\x0310H\x0311E \x0302M\x0312A\x0306T\x0313E\x0305R\x0304N\x0307A\x0308!',
  '\x0303¡\x0309S\x0310Ú\x0311P\x0302E\x0312R \x0306B\x0313O\x0305F\x0304E\x0307T\x0308A\x0303D\x0309A \x0310A\x0311N\x0302O \x0312N\x0306O \x0313M\x0305Á\x0304S \x0307L\x0308E\x0303C\x0309H\x0310E\x0311M\x0302A\x0312T\x0306E\x0313R\x0305N\x0304A\x0307!',
];

export interface CommandHandlerParams {
  nats: InstanceType<typeof NatsClient>;
  commandUUID: string;
  config: SuperslapRootConfig;
}

export async function handleSuperslapsiestaCommand({
  nats,
  commandUUID,
  config,
}: CommandHandlerParams): Promise<NatsSubscriptionResult> {
  const superslapsiestaCommandSub = nats.subscribe(
    `command.execute.${commandUUID}`,
    async (subject, message) => {
      try {
        const data = JSON.parse(message.string());
        log.info('Received command.execute for superslapsiesta', {
          producer: 'superslap', platform: data.platform, instance: data.instance, channel: data.channel, user: data.user,
        });

        if (!isVulnerableUser({ nick: data.user, ident: '', hostname: data.userHost || '', modes: [] }, config)) {
          void sendChatMessage(nats, { channel: data.channel, network: data.network, instance: data.instance, platform: data.platform, text: '¡Abuso del moderador!', trace: data.trace }, metrics);
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
        const slapIndex = Math.floor(Math.random() * spanishSlaps.length);

        const messages = [
          { delay: 1000, type: 'say' as const, text: '\x034\x02¡SU ANO \x0310S\x0311Ú\x0302P\x0312E\x0306R\x0f\x034 BOFETADA TIEMPO!' },
          { delay: 3000, type: 'say' as const, text: `${data.user} escupe en el suelo!` },
          { delay: 6000, type: 'say' as const, text: 'la saliva lee ..' },
          { delay: 8000, type: 'say' as const, text: `${target}!` },
          { delay: 10000, type: 'action' as const, text: `\x0305S\x0304Ú\x0307P\x0308E\x0303R\x0f abofetea ${target} ano!!` },
          { delay: 12000, type: 'raw' as const, text: `KICK ${data.channel} ${target} :${spanishSlaps[slapIndex]}` },
        ];

        sendDelayedMessages(messages, data, nats);
      } catch (error) {
        log.error('Failed to process superslapsiesta command', { producer: 'superslap', error: error instanceof Error ? error.message : String(error) });
      }
    }
  );

  return superslapsiestaCommandSub;
}
