'use strict';

// Superslap module
// Implements various slap commands targeting users in a channel

import { NatsClient, log } from '@eeveebot/libeevee';
import { randomUUID } from 'node:crypto';
import { loadSuperslapConfig } from './lib/config-loader.mjs';
import { SuperslapRootConfig } from './types/config.types.mjs';

// Record module startup time for uptime tracking
const moduleStartTime = Date.now();

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
// Do whatever teardown is necessary before calling common handler
process.on('SIGINT', () => {
  natsClients.forEach((natsClient) => {
    void natsClient.drain();
  });
});

process.on('SIGTERM', () => {
  natsClients.forEach((natsClient) => {
    void natsClient.drain();
  });
});

//
// Setup NATS connection

// Get host and token
const natsHost = process.env.NATS_HOST || false;
if (!natsHost) {
  const msg = 'environment variable NATS_HOST is not set.';
  throw new Error(msg);
}

const natsToken = process.env.NATS_TOKEN || false;
if (!natsToken) {
  const msg = 'environment variable NATS_TOKEN is not set.';
  throw new Error(msg);
}

const nats = new NatsClient({
  natsHost: natsHost as string,
  natsToken: natsToken as string,
});
natsClients.push(nats);
await nats.connect();

// Load superslap configuration
let superslapConfig: SuperslapRootConfig;
try {
  superslapConfig = await loadSuperslapConfig();
} catch (error) {
  log.error('Failed to load superslap configuration', {
    producer: 'superslap',
    error: error instanceof Error ? error.message : String(error),
  });
  throw error;
}

// Function to register all superslap commands with the router
async function registerSuperslapCommands(): Promise<void> {
  // Default rate limit configuration
  const defaultRateLimit = {
    mode: 'drop',
    level: 'user',
    limit: 3,
    interval: '1m',
  };

  // Use configured rate limits or defaults
  const slapanusRateLimit =
    superslapConfig.ratelimits?.slapanus || defaultRateLimit;
  const superslapanusRateLimit =
    superslapConfig.ratelimits?.superslapanus || defaultRateLimit;
  const superslapanusv2RateLimit =
    superslapConfig.ratelimits?.superslapanusv2 || defaultRateLimit;
  const supersuckurdickRateLimit =
    superslapConfig.ratelimits?.supersuckurdick || defaultRateLimit;
  const superslapaniggasanusRateLimit =
    superslapConfig.ratelimits?.superslapaniggasanus || defaultRateLimit;
  const superslapsiestaRateLimit =
    superslapConfig.ratelimits?.superslapsiesta || defaultRateLimit;
  const superslapbakaRateLimit =
    superslapConfig.ratelimits?.superslapbaka || defaultRateLimit;

  // Register slapanus command
  const slapanusCommandRegistration = {
    type: 'command.register',
    commandUUID: slapanusCommandUUID,
    commandDisplayName: 'slapanus',
    platform: '.*',
    network: '.*',
    instance: '.*',
    channel: '.*',
    user: '.*',
    regex: '^slapanus ',
    platformPrefixAllowed: true,
    ratelimit: slapanusRateLimit,
  };

  // Register superslapanus command
  const superslapanusCommandRegistration = {
    type: 'command.register',
    commandUUID: superslapanusCommandUUID,
    commandDisplayName: 'superslapanus',
    platform: '.*',
    network: '.*',
    instance: '.*',
    channel: '.*',
    user: '.*',
    regex: '^superslapanus ',
    platformPrefixAllowed: true,
    ratelimit: superslapanusRateLimit,
  };

  // Register superslapanusv2 command
  const superslapanusv2CommandRegistration = {
    type: 'command.register',
    commandUUID: superslapanusv2CommandUUID,
    commandDisplayName: 'superslapanusv2',
    platform: '.*',
    network: '.*',
    instance: '.*',
    channel: '.*',
    user: '.*',
    regex: '^superslapanusv2 ',
    platformPrefixAllowed: true,
    ratelimit: superslapanusv2RateLimit,
  };

  // Register supersuckurdick command
  const supersuckurdickCommandRegistration = {
    type: 'command.register',
    commandUUID: supersuckurdickCommandUUID,
    commandDisplayName: 'supersuckurdick',
    platform: '.*',
    network: '.*',
    instance: '.*',
    channel: '.*',
    user: '.*',
    regex: '^supersuckurdick ',
    platformPrefixAllowed: true,
    ratelimit: supersuckurdickRateLimit,
  };

  // Register superslapaniggasanus command
  const superslapaniggasanusCommandRegistration = {
    type: 'command.register',
    commandUUID: superslapaniggasanusCommandUUID,
    commandDisplayName: 'superslapaniggasanus',
    platform: '.*',
    network: '.*',
    instance: '.*',
    channel: '.*',
    user: '.*',
    regex: '^superslapaniggasanus ',
    platformPrefixAllowed: true,
    ratelimit: superslapaniggasanusRateLimit,
  };

  // Register superslapsiesta command
  const superslapsiestaCommandRegistration = {
    type: 'command.register',
    commandUUID: superslapsiestaCommandUUID,
    commandDisplayName: 'superslapsiesta',
    platform: '.*',
    network: '.*',
    instance: '.*',
    channel: '.*',
    user: '.*',
    regex: '^superslapsiesta ',
    platformPrefixAllowed: true,
    ratelimit: superslapsiestaRateLimit,
  };

  // Register superslapbaka command
  const superslapbakaCommandRegistration = {
    type: 'command.register',
    commandUUID: superslapbakaCommandUUID,
    commandDisplayName: 'superslapbaka',
    platform: '.*',
    network: '.*',
    instance: '.*',
    channel: '.*',
    user: '.*',
    regex: '^superslapbaka ',
    platformPrefixAllowed: true,
    ratelimit: superslapbakaRateLimit,
  };

  try {
    await nats.publish(
      'command.register',
      JSON.stringify(slapanusCommandRegistration)
    );
    await nats.publish(
      'command.register',
      JSON.stringify(superslapanusCommandRegistration)
    );
    await nats.publish(
      'command.register',
      JSON.stringify(superslapanusv2CommandRegistration)
    );
    await nats.publish(
      'command.register',
      JSON.stringify(supersuckurdickCommandRegistration)
    );
    await nats.publish(
      'command.register',
      JSON.stringify(superslapaniggasanusCommandRegistration)
    );
    await nats.publish(
      'command.register',
      JSON.stringify(superslapsiestaCommandRegistration)
    );
    await nats.publish(
      'command.register',
      JSON.stringify(superslapbakaCommandRegistration)
    );
    log.info('Registered all superslap commands with router', {
      producer: 'superslap',
    });
  } catch (error) {
    log.error('Failed to register superslap commands', {
      producer: 'superslap',
      error: error,
    });
  }
}

// Register commands at startup
await registerSuperslapCommands();

// Global map to store pending user list requests
const pendingUserRequests = new Map<
  string,
  {
    resolve: (
      users: Array<{
        nick: string;
        ident: string;
        hostname: string;
        modes: string[];
      }>
    ) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }
>();

// Helper function to get users in a channel by querying the IRC connector
async function getUsersInChannel(
  platform: string,
  instance: string,
  channel: string,
  nats: InstanceType<typeof NatsClient>
): Promise<
  Array<{ nick: string; ident: string; hostname: string; modes: string[] }>
> {
  return new Promise((resolve, reject) => {
    // Generate a unique reply channel
    const replyChannel = `superslap.userlist.reply.${randomUUID()}`;

    // Set up timeout
    const timeout = setTimeout(() => {
      // Clean up the pending request
      pendingUserRequests.delete(replyChannel);

      reject(new Error('Timeout waiting for user list'));
    }, 5000); // 5 second timeout

    // Store the promise resolver
    pendingUserRequests.set(replyChannel, { resolve, reject, timeout });

    // Subscribe to the reply channel
    void nats
      .subscribe(replyChannel, (subject, message) => {
        try {
          // Clean up the pending request
          const request = pendingUserRequests.get(replyChannel);
          if (request) {
            clearTimeout(request.timeout);
            pendingUserRequests.delete(replyChannel);
          }

          // Parse the response
          const response = JSON.parse(message.string());

          // Check if there was an error
          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          // Return full user objects with hostmask information
          resolve(response.users);
        } catch (error) {
          log.error('Failed to process user list response', {
            producer: 'superslap',
            error: error instanceof Error ? error.message : String(error),
          });
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      })
      .catch((error) => {
        log.error('Failed to subscribe to user list reply channel', {
          producer: 'superslap',
          error: error instanceof Error ? error.message : String(error),
        });
        reject(error instanceof Error ? error : new Error(String(error)));
      });

    // Send the control command to the IRC connector
    const controlMessage = {
      action: 'list-users-in-channel',
      data: {
        channel: channel,
        replyChannel: replyChannel,
      },
    };

    const controlTopic = `control.chatConnectors.${platform}.${instance}`;
    void nats.publish(controlTopic, JSON.stringify(controlMessage));
  });
}

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

      const response = {
        channel: data['channel'],
        network: data['network'],
        instance: data['instance'],
        platform: data['platform'],
        text: text,
        trace: data['trace'],
        type: type === 'action' ? 'action.outgoing' : 'message.outgoing',
      };

      const outgoingTopic = `chat.${type === 'action' ? 'action' : 'message'}.outgoing.${data['platform']}.${data['instance']}.${data['channel']}`;
      void nats.publish(outgoingTopic, JSON.stringify(response));
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
        users = await getUsersInChannel(
          data.platform,
          data.instance,
          data.channel,
          nats
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
        users = await getUsersInChannel(
          data.platform,
          data.instance,
          data.channel,
          nats
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
          text: "\x034\x02IT'S \x033S\x08U\x07P\x03E\x06R\x0c!\x09!\x08 \x034ANUS SLAPPING TIME!",
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
          text: `\x02\x033S\x08U\x07P\x03E\x06R\x0c!\x09!\x08\x03 slaps ${target}'s anus!!`,
        },
        {
          delay: 12000,
          type: 'raw' as const,
          text: `KICK ${data.channel} ${target} :\x033S\x08U\x07P\x03E\x06R\x0cA\x09N\x08A\x03L\x06S\x0cU\x07P\x03E\x06R\x0cA\x09N\x08A\x03L\x06S\x0cU\x07P\x03E\x06R\x0cA\x09N\x08A\x03L\x06S\x0cU\x07P\x03E\x06R\x0cA\x09N\x08A\x03L`,
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
        const errorMsg = {
          channel: data.channel,
          network: data.network,
          instance: data.instance,
          platform: data.platform,
          text: 'You clearly take your moderation duties very seriously',
          trace: data.trace,
          type: 'message.outgoing',
        };

        const outgoingTopic = `chat.message.outgoing.${data.platform}.${data.instance}.${data.channel}`;
        void nats.publish(outgoingTopic, JSON.stringify(errorMsg));
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
        users = await getUsersInChannel(
          data.platform,
          data.instance,
          data.channel,
          nats
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
          text: '\x06,4I\x13,07T\x12,08S\x03,09 \x08,12S\x07,13U\x04,06P\x06,04E\x13,07R\x12,08 \x03,09S\x08,12L\x07,13A\x04,06P\x06,04 \x13,07A\x12,08N\x03,09U\x08,12S\x07,13 \x04,06v\x06,042\x13,07 \x12,08!\x03,09!\x08,12!\x07,13!\x04,06!\x06,04!\x13,07!\x12,08!\x03,09!',
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
          text: `\x02 \x06,4S\x13,07U\x12,08P\x03,09E\x08,12R\x07,13 \x04,06 slaps ${target}'s anus!!!!`,
        },
        {
          delay: 12000,
          type: 'raw' as const,
          text: `KICK ${data.channel} ${target} :\x06,4S\x13,07U\x12,08P\x03,09E\x08,12R\x07,13A\x04,06N\x06,04A\x13,07L\x12,08S\x03,09U\x08,12P\x07,13E\x04,06R\x06,04A\x13,07N\x12,08A\x03,09L\x08,12S\x07,13U\x04,06P\x06,04E\x13,07R\x12,08A\x03,09N\x08,12A\x07,13L`,
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
        const errorMsg = {
          channel: data.channel,
          network: data.network,
          instance: data.instance,
          platform: data.platform,
          text: 'Fuck da police',
          trace: data.trace,
          type: 'message.outgoing',
        };

        const outgoingTopic = `chat.message.outgoing.${data.platform}.${data.instance}.${data.channel}`;
        void nats.publish(outgoingTopic, JSON.stringify(errorMsg));
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
        users = await getUsersInChannel(
          data.platform,
          data.instance,
          data.channel,
          nats
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
        const errorMsg = {
          channel: data.channel,
          network: data.network,
          instance: data.instance,
          platform: data.platform,
          text: 'Super suck your own dick',
          trace: data.trace,
          type: 'message.outgoing',
        };

        const outgoingTopic = `chat.message.outgoing.${data.platform}.${data.instance}.${data.channel}`;
        void nats.publish(outgoingTopic, JSON.stringify(errorMsg));
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
        users = await getUsersInChannel(
          data.platform,
          data.instance,
          data.channel,
          nats
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
          text: "\x039\x02IT'S \x033S\x08U\x07P\x03E\x06R\x0c!\x09!\x08 \x039SUCK UR DICK TIME!",
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
          text: `KICK ${data.channel} ${target} :\x033S\x08U\x07P\x03E\x06R\x0cC\x09O\x08C\x03K\x06S\x0cU\x07P\x03E\x06R\x0cC\x09O\x08C\x03K\x06S\x0cU\x07P\x03E\x06R\x0cC\x09O\x08C\x03K\x06S\x0cU\x07P\x03E\x06R\x0cC\x09O\x08C\x03K\x06S\x0cU\x07P\x03E\x06R\x0cC\x09O\x08C\x03K`,
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
        const errorMsg = {
          channel: data.channel,
          network: data.network,
          instance: data.instance,
          platform: data.platform,
          text: '¡Abuso del moderador!',
          trace: data.trace,
          type: 'message.outgoing',
        };

        const outgoingTopic = `chat.message.outgoing.${data.platform}.${data.instance}.${data.channel}`;
        void nats.publish(outgoingTopic, JSON.stringify(errorMsg));
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
        users = await getUsersInChannel(
          data.platform,
          data.instance,
          data.channel,
          nats
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
          text: '\x04\x02¡SU ANO \x10S\x11Ú\x02P\x12E\x06R\x13 \x04BOFETADA TIEMPO!',
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
          text: `\x05S\x04Ú\x07P\x08E\x03R\x0f abofetea ${target} ano!!`,
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
        const errorMsg = {
          channel: data.channel,
          network: data.network,
          instance: data.instance,
          platform: data.platform,
          text: 'Anata wa baka desu',
          trace: data.trace,
          type: 'message.outgoing',
        };

        const outgoingTopic = `chat.message.outgoing.${data.platform}.${data.instance}.${data.channel}`;
        void nats.publish(outgoingTopic, JSON.stringify(errorMsg));
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
        users = await getUsersInChannel(
          data.platform,
          data.instance,
          data.channel,
          nats
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
  '\x11¡\x02S\x12Ú\x06P\x13E\x05R \x04B\x07O\x08F\x03E\x09T\x10A\x11D\x02A \x12A\x06N\x13O \x05N\x04O \x07M\x08Á\x03S \x09L\x10E\x11C\x02H\x12E \x06M\x13A\x05T\x04E\x07R\x08N\x03A\x09!',
  '\x10¡\x11S\x02Ú\x12P\x06E\x13R \x05B\x04O\x07F\x08E\x03T\x09A\x10D\x11A \x02A\x12N\x06O \x13N\x05O \x04M\x07Á\x08S \x03L\x09E\x10C\x11H\x02E \x12M\x06A\x13T\x05E\x04R\x07N\x08A\x03!',
  '\x09¡\x10S\x11Ú\x02P\x12E\x06R \x13B\x05O\x04F\x07E\x08T\x03A\x09D\x10A \x11A\x02N\x12O \x06N\x13O \x05M\x04Á\x07S \x08L\x03E\x09C\x10H\x11E \x02M\x12A\x06T\x13E\x05R\x04N\x07A\x08!',
  '\x03¡\x09S\x10Ú\x11P\x02E\x12R \x06B\x13O\x05F\x04E\x07T\x08A\x03D\x09A \x10A\x11N\x02O \x12N\x06O \x13M\x05Á\x04S \x07L\x08E\x03C\x09H\x10E \x11M\x02A\x12T\x06E\x13R\x05N\x04A\x07!',
];

// Subscribe to control messages for re-registering commands
const controlSubRegisterCommandAll = nats.subscribe(
  'control.registerCommands',
  () => {
    log.info('Received control.registerCommands control message', {
      producer: 'superslap',
    });
    void registerSuperslapCommands();
  }
);
natsSubscriptions.push(controlSubRegisterCommandAll);

// Subscribe to stats.uptime messages and respond with module uptime
const statsUptimeSub = nats.subscribe('stats.uptime', (subject, message) => {
  try {
    const data = JSON.parse(message.string());
    log.info('Received stats.uptime request', {
      producer: 'superslap',
      replyChannel: data.replyChannel,
    });

    // Calculate uptime in milliseconds
    const uptime = Date.now() - moduleStartTime;

    // Send uptime back via the ephemeral reply channel
    const uptimeResponse = {
      module: 'superslap',
      uptime: uptime,
      uptimeFormatted: `${Math.floor(uptime / 86400000)}d ${Math.floor((uptime % 86400000) / 3600000)}h ${Math.floor((uptime % 3600000) / 60000)}m ${Math.floor((uptime % 60000) / 1000)}s`,
    };

    if (data.replyChannel) {
      void nats.publish(data.replyChannel, JSON.stringify(uptimeResponse));
    }
  } catch (error) {
    log.error('Failed to process stats.uptime request', {
      producer: 'superslap',
      error: error,
    });
  }
});
natsSubscriptions.push(statsUptimeSub);

// Help information for superslap commands
const superslapHelp = [
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

// Function to publish help information
async function publishHelp(): Promise<void> {
  const helpUpdate = {
    from: 'superslap',
    help: superslapHelp,
  };

  try {
    await nats.publish('help.update', JSON.stringify(helpUpdate));
    log.info('Published superslap help information', {
      producer: 'superslap',
    });
  } catch (error) {
    log.error('Failed to publish superslap help information', {
      producer: 'superslap',
      error: error,
    });
  }
}

// Publish help information at startup
await publishHelp();

// Subscribe to help update requests
const helpUpdateRequestSub = nats.subscribe('help.updateRequest', () => {
  log.info('Received help.updateRequest message', {
    producer: 'superslap',
  });
  void publishHelp();
});
natsSubscriptions.push(helpUpdateRequestSub);
