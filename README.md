# superslap

> Humorous slap commands that randomly target and kick channel users.

## Overview

Superslap is an eevee chat module that provides a family of slap commands with escalating intensity. When a user invokes a command, the bot selects a random vulnerable user from the channel, stages a dramatic multi-line animation over several seconds, and—depending on the variant—kicks the target from the channel.

The module fits into the eevee ecosystem as a fun/channel-culture module. It registers its commands via the libeevee NATS command system, uses libeevee's channel-user queries to discover who's online, and respects the invulnerability system so operators and configured users are never targeted. Each command has its own rate limit to prevent abuse.

Key design decisions:

- **Vulnerability filtering** — Users on the invulnerable list, matching invulnerable hostmasks, or with IRC operator modes (`+o`, `+O`, `+a`, `+q`) are never selected as targets.
- **Delayed message sequences** — Slaps are staged as timed sequences of says, actions, and kick commands for dramatic effect (1 s → 3 s → 6 s → 8 s → 10 s → 12 s).
- **Multi-language variants** — Spanish (`superslapsiesta`) and Japanese (`superslapbaka`) localisations with culturally-themed messages.

## Features

- Multiple slap variants with different intensities and animations
- Random target selection from channel users
- Vulnerability filtering by nick, hostmask pattern, and IRC operator mode
- Configurable invulnerability lists
- Per-command rate limiting
- Multi-language support (English, Spanish, Japanese)
- Automatic command and help registration via libeevee
- Module metrics and uptime stats

## Install

Superslap is deployed as part of the eevee stack. Add it to your bot's `botModules` configuration (see [Configuration](#configuration) below). The module image is published at `ghcr.io/eeveebot/superslap`.

For local development:

```bash
cd superslap
npm install
```

## Configuration

The module is configured via the `moduleConfig` YAML string in the bot's `botModules` entry.

### Bot module spec

```yaml
botModules:
- name: superslap
  spec:
    size: 1
    image: ghcr.io/eeveebot/superslap:latest
    pullPolicy: Always
    metrics: true
    metricsPort: 8080
    ipcConfig: my-eevee-bot
    moduleName: superslap
    moduleConfig: |
      invulnerableUsers:
        users:
        - admin
        - moderator
        hostmasks:
        - "trusted.*"
      ratelimits:
        slapanus: { windowMs: 10000, limit: 3 }
        superslapanus: { windowMs: 10000, limit: 3 }
```

### Config keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `invulnerableUsers.users` | `string[]` | `["admin", "moderator"]` | Nicks that can never be targeted. |
| `invulnerableUsers.hostmasks` | `string[]` | `[]` | Hostmask regex patterns; matching users are immune. Falls back to exact match if the regex is invalid. |
| `ratelimits.<command>` | `RateLimitConfig` | libeevee default | Per-command rate limit. Keys match command display names (e.g. `slapanus`, `superslapbaka`). |

## Usage / Commands

Send any of the following commands in a channel where the bot is present:

| Command | Description |
|---------|-------------|
| `!slapanus` | Casual slap — stages a brief animation, no kick. |
| `!superslapanus` | Super slap — dramatic animation + kick. |
| `!superslapanusv2` | Super slap v2 — rainbow-coloured animation + kick. Invulnerable users get a snarky reply instead. |
| `!supersuckurdick` | Mystery variant — its own flavour of chaos + kick. |
| `!superslapsiesta` | Spanish-language super slap + kick. Random kick message drawn from a pool. |
| `!superslapbaka` | Japanese-language super slap + kick. |

### Example

```none
<user> !superslapanus
<bot> IT'S SUPER ANUS SLAPPING TIME!
<bot> fishy spits onto the floor!
<bot> The saliva reads...
<bot> victim!
* bot slaps victim's anus!!
*** victim was kicked by bot (SUPERANALSUPERANAL…)
```

If the caller is on the invulnerable list (or has operator modes), the "super" variants will respond with a dismissal instead of running the full animation.

## Architecture

```
┌────────────┐   registerCommand    ┌─────────┐
│  libeevee  │◄─────────────────────│         │
│  (NATS)    │  command.execute.UUID│superslap│
│            │─────────────────────►│         │
└────────────┘                      └────┬────┘
       ▲                                 │
       │  queryChannelUsers              │ getRandomTarget()
       │  sendChatMessage                │ isVulnerableUser()
       │  kick (raw)                     ▼
       │                          ┌──────────────┐
       └──────────────────────────│ Delayed msg  │
                                  │  sequencer   │
                                  └──────────────┘
```

1. **Startup** — The module connects to NATS, loads config, and registers each command with `registerCommand()`. Help entries are registered with `registerHelp()`.
2. **Command received** — A `command.execute.<UUID>` message arrives. The handler queries channel users via `queryChannelUsers()`.
3. **Target selection** — `getRandomTarget()` filters out invulnerable users, the bot itself, and the sender, then picks a random vulnerable nick. If a target is named in the message text, it may be selected (with random chance).
4. **Animation** — `sendDelayedMessages()` queues a timed sequence of `say`, `action`, and `raw` (kick) messages with increasing delays for dramatic effect.
5. **Stats** — Uptime and metrics are exposed via `registerStatsHandlers()`.

## Development

```bash
git clone https://github.com/eeveebot/eevee.git
cd eevee/superslap
npm install
npm test        # lint only (eslint)
npm run build   # lint + tsc compile
npm run dev     # build + run
```

The test suite is lint-only (`eslint`); there are no unit tests currently.

## Contributing

Contributions are welcome! Please see the [eevee contributing guide](https://github.com/eeveebot/eevee) for details.

## License

[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) — see [LICENSE](./LICENSE) for the full text.
