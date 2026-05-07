'use strict';

// Superslap module
// Implements various slap commands targeting users in a channel

import {
  NatsClient,
  log,
  createNatsConnection,
  registerGracefulShutdown,
  createModuleMetrics,
  defaultRateLimit,
  registerCommand,
  sendChatMessage,
  registerHelp,
  HelpEntry,
  registerStatsHandlers,
  queryChannelUsers,
} from '@eeveebot/libeevee';
import { loadModuleConfig } from '@eeveebot/libeevee';
import { SuperslapRootConfig } from './types/config.types.mjs';

// Record module startup time for uptime tracking
const moduleStartTime = Date.now();
const metrics = createModuleMetrics('superslap');

// Command UUIDs
const slapanusCommandUUID = '6771387c-5e25-4758-bdf2-adedcd3d5272';
const superslapanusCommandUUID = '36060973-396b-435c-8998-2980e6c2c0c0';
const superslapanusv2CommandUUID = '6e3c5726-3175-436a-9432-4b8a38d3e986';
const supersuckurdickCommandUUID = '40897742-1474-43e0-9f6d-98fc83296fda';
const superslapaniggasanusCommandUUID = 'b9643e38-0c43-4530-8344-ad48c372e146';
const superslapsiestaCommandUUID = '4398f1b5-6537-49bd-a9c2-7a90fa5e0d87';
const superslapbakaCommandUUID = 'c3104b60-8278-481f-8bbf-db109147abf7';

const natsClients: Array<InstanceType<typeof NatsClient>> = [];
const natsSubscriptions: Array<Promise<string | boolean>> = [];

//
// Register graceful shutdown handler
registerGracefulShutdown(natsClients);

//
// Setup NATS connection
const nats = await createNatsConnection();
natsClients.push(nats);

// Load superslap configuration with defaults merging
const superslapConfig = loadModuleConfig<SuperslapRootConfig>({
  invulnerableUsers: {
    users: ['admin', 'moderator'],
    hostmasks: [],
  },
  ratelimits: {},
});

// Merge defaults for partially-specified invulnerableUsers
if (!superslapConfig.invulnerableUsers) {
  superslapConfig.invulnerableUsers = {
    users: ['admin', 'moderator'],
    hostmasks: [],
  };
} else {
  superslapConfig.invulnerableUsers.users ??= ['admin', 'moderator'];
  superslapConfig.invulnerableUsers.hostmasks ??= [];
}

// Register all superslap commands using registerCommand helper
const commandRegistrations = await Promise.all([
  registerCommand(nats, {
    commandUUID: slapanusCommandUUID,
    commandDisplayName: 'slapanus',
    regex: '^slapanus\\s*',
    ratelimit: superslapConfig.ratelimits?.slapanus || defaultRateLimit,
  }, metrics),
  registerCommand(nats, {
    commandUUID: superslapanusCommandUUID,
    commandDisplayName: 'superslapanus',
    regex: '^superslapanus(?!\\w)\\s*',
    ratelimit: superslapConfig.ratelimits?.superslapanus || defaultRateLimit,
  }, metrics),
  registerCommand(nats, {
    commandUUID: superslapanusv2CommandUUID,
    commandDisplayName: 'superslapanusv2',
    regex: '^superslapanusv2\\s*',
    ratelimit: superslapConfig.ratelimits?.superslapanusv2 || defaultRateLimit,
  }, metrics),
  registerCommand(nats, {
    commandUUID: supersuckurdickCommandUUID,
    commandDisplayName: 'supersuckurdick',
    regex: '^supersuckurdick\\s*',
    ratelimit: superslapConfig.ratelimits?.supersuckurdick || defaultRateLimit,
  }, metrics),
  registerCommand(nats, {
    commandUUID: superslapaniggasanusCommandUUID,
    commandDisplayName: 'superslapaniggasanus',
    regex: '^superslapaniggasanus\\s*',
    ratelimit: superslapConfig.ratelimits?.superslapaniggasanus || defaultRateLimit,
  }, metrics),
  registerCommand(nats, {
    commandUUID: superslapsiestaCommandUUID,
    commandDisplayName: 'superslapsiesta',
    regex: '^superslapsiesta\\s*',
    ratelimit: superslapConfig.ratelimits?.superslapsiesta || defaultRateLimit,
  }, metrics),
  registerCommand(nats, {
    commandUUID: superslapbakaCommandUUID,
    commandDisplayName: 'superslapbaka',
    regex: '^superslapbaka\\s*',
    ratelimit: superslapConfig.ratelimits?.superslapbaka || defaultRateLimit,
  }, metrics),
]);
commandRegistrations.flat().forEach((sub) => natsSubscriptions.push(sub));

// Global map to store pending user list requests

// Helper function to check if a user is vulnerable (not invulnerable according to config)
function isVulnerableUser(
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

// Helper function to get a random target
function getRandomTarget(
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
      // If the target exists in the vulnerable user list
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
    // Else, use the default behavior
  }

  // Pick a random vulnerable user
  const index = Math.floor(Math.random() * vulnerableUsers.length);
  return vulnerableUsers[index].nick;
}

// Helper function to send delayed messages
function sendDelayedMessages(
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
        // For raw messages, we'll extract the command and send it as a kick
        if (text.startsWith('KICK ')) {
          const parts = text.split(' ');
          if (parts.length >= 3) {
            const channel = parts[1];
            const target = parts[2];
            const reason = parts.slice(3).join(' ').substring(1); // Remove the colon

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

// Subscribe to slapanus command execution messages
const slapanusCommandSub = nats.subscribe(
  `command.execute.${slapanusCommandUUID}`,
  async (subject, message) => {
    try {
      const data = JSON.parse(message.string());
      log.info('Received command.execute for slapanus', {
        producer: 'superslap',
        platform: data.platform,
        instance: data.instance,
        channel: data.channel,
        user: data.user,
      });

      // Get users in channel
      let users: Array<{
        nick: string;
        ident: string;
        hostname: string;
        modes: string[];
      }> = [];
      try {
        users = await queryChannelUsers(
          nats,
          data.platform,
          data.instance,
          data.channel,
          { metrics, producer: 'superslap' }
        );
      } catch (error) {
        log.error('Failed to get user list', {
          producer: 'superslap',
          error: error instanceof Error ? error.message : String(error),
        });
        return;
      }

      // Remove the bot itself from the list
      const filteredUsers = users.filter((user) => user.nick !== data.botNick);

      // Pick a random target
      const target = getRandomTarget(
        data.user,
        data.text,
        filteredUsers,
        superslapConfig,
        data.botNick
      );

      // Queue actions
      const messages = [
        {
          delay: 1000,
          type: 'say' as const,
          text: "\x034\x02It's Anus Slapping Time!",
        },
        {
          delay: 3000,
          type: 'say' as const,
          text: 'fishy spits onto the floor!',
        },
        { delay: 6000, type: 'say' as const, text: 'The saliva reads...' },
        { delay: 8000, type: 'say' as const, text: `${target}!` },
        {
          delay: 10000,
          type: 'action' as const,
          text: `slaps\x02 ${target}'s\x02 anus!`,
        },
      ];

      sendDelayedMessages(messages, data, nats);
    } catch (error) {
      log.error('Failed to process slapanus command', {
        producer: 'superslap',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
natsSubscriptions.push(slapanusCommandSub);

// Subscribe to superslapanus command execution messages
const superslapanusCommandSub = nats.subscribe(
  `command.execute.${superslapanusCommandUUID}`,
  async (subject, message) => {
    try {
      const data = JSON.parse(message.string());
      log.info('Received command.execute for superslapanus', {
        producer: 'superslap',
        platform: data.platform,
        instance: data.instance,
        channel: data.channel,
        user: data.user,
      });

      // Get users in channel
      let users: Array<{
        nick: string;
        ident: string;
        hostname: string;
        modes: string[];
      }> = [];
      try {
        users = await queryChannelUsers(
          nats,
          data.platform,
          data.instance,
          data.channel,
          { metrics, producer: 'superslap' }
        );
      } catch (error) {
        log.error('Failed to get user list', {
          producer: 'superslap',
          error: error instanceof Error ? error.message : String(error),
        });
        return;
      }

      // Remove the bot itself from the list
      const filteredUsers = users.filter((user) => user.nick !== data.botNick);

      // Pick a random target
      const target = getRandomTarget(
        data.user,
        data.text,
        filteredUsers,
        superslapConfig,
        data.botNick
      );

      // Queue actions
      const messages = [
        {
          delay: 1000,
          type: 'say' as const,
          text: "\x034\x02IT'S \x033S\x038U\x0311P\x034E\x036R\x0312!\x039!\x038 \x034ANUS SLAPPING TIME!",
        },
        {
          delay: 3000,
          type: 'say' as const,
          text: 'fishy spits onto the floor!',
        },
        { delay: 6000, type: 'say' as const, text: 'The saliva reads...' },
        { delay: 8000, type: 'say' as const, text: `${target}!` },
        {
          delay: 10000,
          type: 'action' as const,
          text: `\x02\x033S\x038U\x0311P\x034E\x036R\x0312!\x039!\x038\x03 slaps ${target}'s anus!!`,
        },
        {
          delay: 12000,
          type: 'raw' as const,
          text: `KICK ${data.channel} ${target} :\x033S\x038U\x0311P\x034E\x036R\x0310A\x039N\x038A\x034L\x033S\x038U\x0311P\x034E\x036R\x0310A\x039N\x038A\x034L\x033S\x038U\x0311P\x034E\x036R\x0310A\x039N\x038A\x034L\x033S\x038U\x0311P\x034E\x036R\x0310A\x039N\x038A\x034L`,
        },
      ];

      sendDelayedMessages(messages, data, nats);
    } catch (error) {
      log.error('Failed to process superslapanus command', {
        producer: 'superslap',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
natsSubscriptions.push(superslapanusCommandSub);

// Subscribe to superslapanusv2 command execution messages
const superslapanusv2CommandSub = nats.subscribe(
  `command.execute.${superslapanusv2CommandUUID}`,
  async (subject, message) => {
    try {
      const data = JSON.parse(message.string());
      log.info('Received command.execute for superslapanusv2', {
        producer: 'superslap',
        platform: data.platform,
        instance: data.instance,
        channel: data.channel,
        user: data.user,
      });

      // Check if user is vulnerable
      if (
        !isVulnerableUser(
          {
            nick: data.user,
            ident: '',
            hostname: data.userHost || '',
            modes: [],
          },
          superslapConfig
        )
      ) {
        void sendChatMessage(nats, {
          channel: data.channel,
          network: data.network,
          instance: data.instance,
          platform: data.platform,
          text: 'You clearly take your moderation duties very seriously',
          trace: data.trace,
        }, metrics);
        return;
      }

      // Get users in channel
      let users: Array<{
        nick: string;
        ident: string;
        hostname: string;
        modes: string[];
      }> = [];
      try {
        users = await queryChannelUsers(
          nats,
          data.platform,
          data.instance,
          data.channel,
          { metrics, producer: 'superslap' }
        );
      } catch (error) {
        log.error('Failed to get user list', {
          producer: 'superslap',
          error: error instanceof Error ? error.message : String(error),
        });
        return;
      }

      // Remove the bot itself from the list
      const filteredUsers = users.filter((user) => user.nick !== data.botNick);

      // Pick a random target
      const target = getRandomTarget(
        data.user,
        data.text,
        filteredUsers,
        superslapConfig,
        data.botNick
      );

      // Queue actions
      const messages = [
        {
          delay: 1000,
          type: 'say' as const,
          text: '\x036,4I\x0313,07T\x0312,08S\x033,09 \x038,12S\x037,13U\x034,06P\x036,04E\x0313,07R\x0312,08 \x033,09S\x038,12L\x037,13A\x034,06P\x036,04 \x0313,07A\x0312,08N\x033,09U\x038,12S\x037,13 \x034,06v\x036,042\x0313,07 \x0312,08!\x033,09!\x038,12!\x037,13!\x034,06!\x036,04!\x0313,07!\x0312,08!\x033,09!',
        },
        {
          delay: 3000,
          type: 'say' as const,
          text: 'fishy spits onto the floor!',
        },
        { delay: 6000, type: 'say' as const, text: 'The saliva reads...' },
        { delay: 8000, type: 'say' as const, text: `${target}!` },
        {
          delay: 10000,
          type: 'action' as const,
          text: `\x02 \x036,4S\x0313,07U\x0312,08P\x033,09E\x038,12R\x03 slaps ${target}'s anus!!!!`,
        },
        {
          delay: 12000,
          type: 'raw' as const,
          text: `KICK ${data.channel} ${target} :\x036,4S\x0313,07U\x0312,08P\x033,09E\x038,12R\x037,13A\x034,06N\x036,04A\x0313,07L\x0312,08S\x033,09U\x038,12P\x037,13E\x034,06R\x036,04A\x0313,07N\x0312,08A\x033,09L\x038,12S\x037,13U\x034,06P\x036,04E\x0313,07R\x0312,08A\x033,09N\x038,12A\x037,13L\x034,06S\x036,04U\x0313,07P\x0312,08E\x033,09R\x038,12A\x037,13N\x034,06A\x036,04L\x0313,07S\x0312,08U\x033,09P\x038,12E\x037,13R\x034,06A\x036,04N\x0313,07A\x0312,08L\x033,09S\x038,12U\x037,13P\x034,06E\x036,04R\x0313,07A\x0312,08N\x033,09A\x038,12L`,
        },
      ];

      sendDelayedMessages(messages, data, nats);
    } catch (error) {
      log.error('Failed to process superslapanusv2 command', {
        producer: 'superslap',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
natsSubscriptions.push(superslapanusv2CommandSub);

// Subscribe to superslapaniggasanus command execution messages
const superslapaniggasanusCommandSub = nats.subscribe(
  `command.execute.${superslapaniggasanusCommandUUID}`,
  async (subject, message) => {
    try {
      const data = JSON.parse(message.string());
      log.info('Received command.execute for superslapaniggasanus', {
        producer: 'superslap',
        platform: data.platform,
        instance: data.instance,
        channel: data.channel,
        user: data.user,
      });

      // Check if user is vulnerable
      if (
        !isVulnerableUser(
          {
            nick: data.user,
            ident: '',
            hostname: data.userHost || '',
            modes: [],
          },
          superslapConfig
        )
      ) {
        void sendChatMessage(nats, {
          channel: data.channel,
          network: data.network,
          instance: data.instance,
          platform: data.platform,
          text: 'Fuck da police',
          trace: data.trace,
        }, metrics);
        return;
      }

      // Get users in channel
      let users: Array<{
        nick: string;
        ident: string;
        hostname: string;
        modes: string[];
      }> = [];
      try {
        users = await queryChannelUsers(
          nats,
          data.platform,
          data.instance,
          data.channel,
          { metrics, producer: 'superslap' }
        );
      } catch (error) {
        log.error('Failed to get user list', {
          producer: 'superslap',
          error: error instanceof Error ? error.message : String(error),
        });
        return;
      }

      // Remove the bot itself from the list
      const filteredUsers = users.filter((user) => user.nick !== data.botNick);

      // Pick a random target
      const target = getRandomTarget(
        data.user,
        data.text,
        filteredUsers,
        superslapConfig,
        data.botNick
      );

      // Queue actions
      const messages = [
        {
          delay: 1000,
          type: 'say' as const,
          text: "\x031\x02IT'S SUPER SLAP A NIGGAS ANUS TIME!!!",
        },
        {
          delay: 3000,
          type: 'say' as const,
          text: 'This nigga fishy \x02GETS BUCK\x02!',
        },
        { delay: 6000, type: 'say' as const, text: 'What it do ...? ' },
        { delay: 8000, type: 'say' as const, text: `${target}!` },
        {
          delay: 10000,
          type: 'action' as const,
          text: `\x02 \x031\x02SUPER SLAPS ${target}'s BLACK ANUS!`,
        },
        {
          delay: 20000,
          type: 'raw' as const,
          text: `KICK ${data.channel} ${target} :\x031THISNIGGASDOWNTHISNIGGASDOWNTHISNIGGASDOWNTHISNIGGASDOWNTHISNIGGASDOWNTHISNIGGASDOWN`,
        },
      ];

      sendDelayedMessages(messages, data, nats);
    } catch (error) {
      log.error('Failed to process superslapaniggasanus command', {
        producer: 'superslap',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
natsSubscriptions.push(superslapaniggasanusCommandSub);

// Subscribe to supersuckurdick command execution messages
const supersuckurdickCommandSub = nats.subscribe(
  `command.execute.${supersuckurdickCommandUUID}`,
  async (subject, message) => {
    try {
      const data = JSON.parse(message.string());
      log.info('Received command.execute for supersuckurdick', {
        producer: 'superslap',
        platform: data.platform,
        instance: data.instance,
        channel: data.channel,
        user: data.user,
      });

      // Check if user is vulnerable
      if (
        !isVulnerableUser(
          {
            nick: data.user,
            ident: '',
            hostname: data.userHost || '',
            modes: [],
          },
          superslapConfig
        )
      ) {
        void sendChatMessage(nats, {
          channel: data.channel,
          network: data.network,
          instance: data.instance,
          platform: data.platform,
          text: 'Super suck your own dick',
          trace: data.trace,
        }, metrics);
        return;
      }

      // Get users in channel
      let users: Array<{
        nick: string;
        ident: string;
        hostname: string;
        modes: string[];
      }> = [];
      try {
        users = await queryChannelUsers(
          nats,
          data.platform,
          data.instance,
          data.channel,
          { metrics, producer: 'superslap' }
        );
      } catch (error) {
        log.error('Failed to get user list', {
          producer: 'superslap',
          error: error instanceof Error ? error.message : String(error),
        });
        return;
      }

      // Remove the bot itself from the list
      const filteredUsers = users.filter((user) => user.nick !== data.botNick);

      // Pick a random target
      const target = getRandomTarget(
        data.user,
        data.text,
        filteredUsers,
        superslapConfig,
        data.botNick
      );

      // Queue actions
      const messages = [
        {
          delay: 1000,
          type: 'say' as const,
          text: "\x039\x02IT'S \x033S\x038U\x0311P\x034E\x036R\x0312!\x039!\x038 \x039SUCK UR DICK TIME!",
        },
        {
          delay: 3000,
          type: 'say' as const,
          text: `${data.user} opens his mouth!`,
        },
        { delay: 6000, type: 'say' as const, text: 'HE TAKES THE LOAD...' },
        { delay: 8000, type: 'say' as const, text: `${target}!` },
        {
          delay: 12000,
          type: 'raw' as const,
          text: `KICK ${data.channel} ${target} :\x033S\x038U\x0311P\x034E\x036R\x0310C\x039O\x038C\x034K\x033S\x038U\x0311P\x034E\x036R\x0310C\x039O\x038C\x034K\x033S\x038U\x0311P\x034E\x036R\x0310C\x039O\x038C\x034K\x033S\x038U\x0311P\x034E\x036R\x0310C\x039O\x038C\x034K\x033S\x038U\x0311P\x034E\x036R\x0310C\x039O\x038C\x034K`,
        },
      ];

      sendDelayedMessages(messages, data, nats);
    } catch (error) {
      log.error('Failed to process supersuckurdick command', {
        producer: 'superslap',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
natsSubscriptions.push(supersuckurdickCommandSub);

// Subscribe to superslapsiesta command execution messages
const superslapsiestaCommandSub = nats.subscribe(
  `command.execute.${superslapsiestaCommandUUID}`,
  async (subject, message) => {
    try {
      const data = JSON.parse(message.string());
      log.info('Received command.execute for superslapsiesta', {
        producer: 'superslap',
        platform: data.platform,
        instance: data.instance,
        channel: data.channel,
        user: data.user,
      });

      // Check if user is vulnerable
      if (
        !isVulnerableUser(
          {
            nick: data.user,
            ident: '',
            hostname: data.userHost || '',
            modes: [],
          },
          superslapConfig
        )
      ) {
        void sendChatMessage(nats, {
          channel: data.channel,
          network: data.network,
          instance: data.instance,
          platform: data.platform,
          text: '¡Abuso del moderador!',
          trace: data.trace,
        }, metrics);
        return;
      }

      // Get users in channel
      let users: Array<{
        nick: string;
        ident: string;
        hostname: string;
        modes: string[];
      }> = [];
      try {
        users = await queryChannelUsers(
          nats,
          data.platform,
          data.instance,
          data.channel,
          { metrics, producer: 'superslap' }
        );
      } catch (error) {
        log.error('Failed to get user list', {
          producer: 'superslap',
          error: error instanceof Error ? error.message : String(error),
        });
        return;
      }

      // Remove the bot itself from the list
      const filteredUsers = users.filter((user) => user.nick !== data.botNick);

      // Pick a random target
      const target = getRandomTarget(
        data.user,
        data.text,
        filteredUsers,
        superslapConfig,
        data.botNick
      );

      // Pick a random slap message
      const slapIndex = Math.floor(Math.random() * spanishSlaps.length);

      // Queue actions
      const messages = [
        {
          delay: 1000,
          type: 'say' as const,
          text: '\x034\x02¡SU ANO \x0310S\x0311Ú\x0302P\x0312E\x0306R\x0f\x034 BOFETADA TIEMPO!',
        },
        {
          delay: 3000,
          type: 'say' as const,
          text: `${data.user} escupe en el suelo!`,
        },
        { delay: 6000, type: 'say' as const, text: 'la saliva lee ..' },
        { delay: 8000, type: 'say' as const, text: `${target}!` },
        {
          delay: 10000,
          type: 'action' as const,
          text: `\x0305S\x0304Ú\x0307P\x0308E\x0303R\x0f abofetea ${target} ano!!`,
        },
        {
          delay: 12000,
          type: 'raw' as const,
          text: `KICK ${data.channel} ${target} :${spanishSlaps[slapIndex]}`,
        },
      ];

      sendDelayedMessages(messages, data, nats);
    } catch (error) {
      log.error('Failed to process superslapsiesta command', {
        producer: 'superslap',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
natsSubscriptions.push(superslapsiestaCommandSub);

// Subscribe to superslapbaka command execution messages
const superslapbakaCommandSub = nats.subscribe(
  `command.execute.${superslapbakaCommandUUID}`,
  async (subject, message) => {
    try {
      const data = JSON.parse(message.string());
      log.info('Received command.execute for superslapbaka', {
        producer: 'superslap',
        platform: data.platform,
        instance: data.instance,
        channel: data.channel,
        user: data.user,
      });

      // Check if user is vulnerable
      if (
        !isVulnerableUser(
          {
            nick: data.user,
            ident: '',
            hostname: data.userHost || '',
            modes: [],
          },
          superslapConfig
        )
      ) {
        void sendChatMessage(nats, {
          channel: data.channel,
          network: data.network,
          instance: data.instance,
          platform: data.platform,
          text: 'Anata wa baka desu',
          trace: data.trace,
        }, metrics);
        return;
      }

      // Get users in channel
      let users: Array<{
        nick: string;
        ident: string;
        hostname: string;
        modes: string[];
      }> = [];
      try {
        users = await queryChannelUsers(
          nats,
          data.platform,
          data.instance,
          data.channel,
          { metrics, producer: 'superslap' }
        );
      } catch (error) {
        log.error('Failed to get user list', {
          producer: 'superslap',
          error: error instanceof Error ? error.message : String(error),
        });
        return;
      }

      // Remove the bot itself from the list
      const filteredUsers = users.filter((user) => user.nick !== data.botNick);

      // Pick a random target
      const target = getRandomTarget(
        data.user,
        data.text,
        filteredUsers,
        superslapConfig,
        data.botNick
      );

      // Queue actions
      const messages = [
        {
          delay: 1000,
          type: 'say' as const,
          text: '\x04\x02Sūpa kōmon tataki no jikandesu!',
        },
        {
          delay: 3000,
          type: 'say' as const,
          text: `${data.user} wa yuka ni haku!`,
        },
        { delay: 6000, type: 'say' as const, text: 'Daeki dokusho...' },
        { delay: 8000, type: 'say' as const, text: `${target}!` },
        {
          delay: 10000,
          type: 'action' as const,
          text: `wa SUUPAA!! ${target} no kōmon o tataku!!`,
        },
        {
          delay: 12000,
          type: 'raw' as const,
          text: `KICK ${data.channel} ${target} :SUPAAOSHIRISUPAAOSHIRISUUPAOSHIRISUUPAOSHIRISUUPAOSHIRI`,
        },
      ];

      sendDelayedMessages(messages.slice(0, 5), data, nats);

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
      log.error('Failed to process superslapbaka command', {
        producer: 'superslap',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
natsSubscriptions.push(superslapbakaCommandSub);

// Spanish slap messages
const spanishSlaps = [
  '\x0311¡\x0302S\x0312Ú\x0306P\x0313E\x0305R \x0304B\x0307O\x0308F\x0303E\x0309T\x0310A\x0311D\x0302A \x0312A\x0306N\x0313O \x0305N\x0304O \x0307M\x0308Á\x0303S \x0309L\x0310E\x0311C\x0302H\x0312E \x0306M\x0313A\x0305T\x0304E\x0307R\x0308N\x0303A\x0309!',
  '\x0310¡\x0311S\x0302Ú\x0312P\x0306E\x0313R \x0305B\x0304O\x0307F\x0308E\x0303T\x0309A\x0310D\x0311A \x0302A\x0312N\x0306O \x0313N\x0305O \x0304M\x0307Á\x0308S \x0303L\x0309E\x0310C\x0311H\x0302E \x0312M\x0306A\x0313T\x0305E\x0304R\x0307N\x0308A\x0303!',
  '\x0309¡\x0310S\x0311Ú\x0302P\x0312E\x0306R \x0313B\x0305O\x0304F\x0307E\x0308T\x0303A\x0309D\x0310A \x0311A\x0302N\x0312O \x0306N\x0313O \x0305M\x0304Á\x0307S \x0308L\x0303E\x0309C\x0310H\x0311E \x0302M\x0312A\x0306T\x0313E\x0305R\x0304N\x0307A\x0308!',
  '\x0303¡\x0309S\x0310Ú\x0311P\x0302E\x0312R \x0306B\x0313O\x0305F\x0304E\x0307T\x0308A\x0303D\x0309A \x0310A\x0311N\x0302O \x0312N\x0306O \x0313M\x0305Á\x0304S \x0307L\x0308E\x0303C\x0309H\x0310E\x0311M\x0302A\x0312T\x0306E\x0313R\x0305N\x0304A\x0307!',
];

// Note: control.registerCommands subscriptions are now handled by registerCommand() above

// Subscribe to stats.uptime and stats.emit.request
const statsSubs = registerStatsHandlers({ nats, moduleName: 'superslap', startTime: moduleStartTime, metrics });
natsSubscriptions.push(...statsSubs);

// Help information for superslap commands
const superslapHelp: HelpEntry[] = [
  {
    command: 'slapanus',
    descr: "Casually slaps a random user's anus",
    params: [],
  },
  {
    command: 'superslapanus',
    descr: 'Knocks a random user out of the room by the anus',
    params: [],
  },
  {
    command: 'superslapanusv2',
    descr: 'Knocks a random user out of the room by the anus, but v2',
    params: [],
  },
  {
    command: 'supersuckurdick',
    descr: "I don't know how or WHY, it's just here OKAY?!",
    params: [],
  },
  {
    command: 'superslapaniggasanus',
    descr: 'Nigga you better shut yo gatdam lip',
    params: [],
  },
  {
    command: 'superslapsiesta',
    descr: 'Spanish version of superslap',
    params: [],
  },
  {
    command: 'superslapbaka',
    descr: 'Japanese version of superslap',
    params: [],
  },
];

// Register help information using registerHelp helper
const helpSubs = await registerHelp(nats, 'superslap', superslapHelp, metrics);
helpSubs.forEach((sub) => natsSubscriptions.push(sub));
