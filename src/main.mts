'use strict';

// Superslap module
// Implements various slap commands targeting users in a channel

import {
  NatsClient,
  createNatsConnection,
  registerGracefulShutdown,
  createModuleMetrics,
  defaultRateLimit,
  registerCommand,
  registerHelp,
  HelpEntry,
  registerStatsHandlers,
  initializeSystemMetrics,
  setupHttpServer,
  NatsSubscriptionResult,
} from '@eeveebot/libeevee';
import { loadModuleConfig } from '@eeveebot/libeevee';
import { SuperslapRootConfig } from './types/config.types.mjs';
import { handleSlapanusCommand } from './commands/slapanus.mjs';
import { handleSuperslapanusCommand } from './commands/superslapanus.mjs';
import { handleSuperslapanusv2Command } from './commands/superslapanusv2.mjs';
import { handleSuperslapaniggasanusCommand } from './commands/superslapaniggasanus.mjs';
import { handleSupersuckurdickCommand } from './commands/supersuckurdick.mjs';
import { handleSuperslapsiestaCommand } from './commands/superslapsiesta.mjs';
import { handleSuperslapbakaCommand } from './commands/superslapbaka.mjs';
import fs from 'node:fs';

// Record module startup time for uptime tracking
const moduleStartTime = Date.now();
const moduleVersion = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version as string;
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
const natsSubscriptions: Array<Promise<NatsSubscriptionResult>> = [];

// Initialize system metrics
initializeSystemMetrics('superslap');

// Setup HTTP server for metrics and health checks
setupHttpServer({
  port: process.env.HTTP_API_PORT || '9000',
  serviceName: 'superslap',
  natsClients: natsClients,
});

// Register graceful shutdown handler
registerGracefulShutdown(natsClients);

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
  registerCommand(nats, { commandUUID: slapanusCommandUUID, commandDisplayName: 'slapanus', regex: '^slapanus\\s*', ratelimit: superslapConfig.ratelimits?.slapanus || defaultRateLimit }, metrics),
  registerCommand(nats, { commandUUID: superslapanusCommandUUID, commandDisplayName: 'superslapanus', regex: '^superslapanus(?!\\w)\\s*', ratelimit: superslapConfig.ratelimits?.superslapanus || defaultRateLimit }, metrics),
  registerCommand(nats, { commandUUID: superslapanusv2CommandUUID, commandDisplayName: 'superslapanusv2', regex: '^superslapanusv2\\s*', ratelimit: superslapConfig.ratelimits?.superslapanusv2 || defaultRateLimit }, metrics),
  registerCommand(nats, { commandUUID: supersuckurdickCommandUUID, commandDisplayName: 'supersuckurdick', regex: '^supersuckurdick\\s*', ratelimit: superslapConfig.ratelimits?.supersuckurdick || defaultRateLimit }, metrics),
  registerCommand(nats, { commandUUID: superslapaniggasanusCommandUUID, commandDisplayName: 'superslapaniggasanus', regex: '^superslapaniggasanus\\s*', ratelimit: superslapConfig.ratelimits?.superslapaniggasanus || defaultRateLimit }, metrics),
  registerCommand(nats, { commandUUID: superslapsiestaCommandUUID, commandDisplayName: 'superslapsiesta', regex: '^superslapsiesta\\s*', ratelimit: superslapConfig.ratelimits?.superslapsiesta || defaultRateLimit }, metrics),
  registerCommand(nats, { commandUUID: superslapbakaCommandUUID, commandDisplayName: 'superslapbaka', regex: '^superslapbaka\\s*', ratelimit: superslapConfig.ratelimits?.superslapbaka || defaultRateLimit }, metrics),
]);
commandRegistrations.flat().forEach((sub) => natsSubscriptions.push(sub));

// Subscribe to command execution messages
natsSubscriptions.push(handleSlapanusCommand({ nats, commandUUID: slapanusCommandUUID, config: superslapConfig }));
natsSubscriptions.push(handleSuperslapanusCommand({ nats, commandUUID: superslapanusCommandUUID, config: superslapConfig }));
natsSubscriptions.push(handleSuperslapanusv2Command({ nats, commandUUID: superslapanusv2CommandUUID, config: superslapConfig }));
natsSubscriptions.push(handleSuperslapaniggasanusCommand({ nats, commandUUID: superslapaniggasanusCommandUUID, config: superslapConfig }));
natsSubscriptions.push(handleSupersuckurdickCommand({ nats, commandUUID: supersuckurdickCommandUUID, config: superslapConfig }));
natsSubscriptions.push(handleSuperslapsiestaCommand({ nats, commandUUID: superslapsiestaCommandUUID, config: superslapConfig }));
natsSubscriptions.push(handleSuperslapbakaCommand({ nats, commandUUID: superslapbakaCommandUUID, config: superslapConfig }));

// Note: control.registerCommands subscriptions are now handled by registerCommand() above

// Subscribe to stats.uptime and stats.emit.request
const statsSubs = registerStatsHandlers({ nats, moduleName: 'superslap', startTime: moduleStartTime, version: moduleVersion, metrics });
natsSubscriptions.push(...statsSubs);

// Help information for superslap commands
const superslapHelp: HelpEntry[] = [
  { command: 'slapanus', descr: "Casually slaps a random user's anus", params: [] },
  { command: 'superslapanus', descr: 'Knocks a random user out of the room by the anus', params: [] },
  { command: 'superslapanusv2', descr: 'Knocks a random user out of the room by the anus, but v2', params: [] },
  { command: 'supersuckurdick', descr: "I don't know how or WHY, it's just here OKAY?!", params: [] },
  { command: 'superslapaniggasanus', descr: 'Nigga you better shut yo gatdam lip', params: [] },
  { command: 'superslapsiesta', descr: 'Spanish version of superslap', params: [] },
  { command: 'superslapbaka', descr: 'Japanese version of superslap', params: [] },
];

// Register help information using registerHelp helper
const helpSubs = await registerHelp(nats, 'superslap', superslapHelp, metrics);
helpSubs.forEach((sub) => natsSubscriptions.push(sub));
