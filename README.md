# superslap

SUPERSLAPBAKA

The Superslap module provides various slap commands that target users in a channel with humorous effects. These commands randomly select targets from users in the channel and apply different slap animations with varying intensity.

## Features

- Multiple slap variants with different intensities
- Random target selection with vulnerability filtering
- Configurable invulnerability lists
- Rate limiting per command
- Multi-language support (English, Spanish, Japanese)
- Automatic command registration

## Commands

- `slapanus` - Casually slaps a random user's anus
- `superslapanus` - Knocks a random user out of the room by the anus
- `superslapanusv2` - Knocks a random user out of the room by the anus, but v2
- `supersuckurdick` - I don't know how or WHY, it's just here OKAY?!
- `superslapsiesta` - Spanish version of superslap
- `superslapbaka` - Japanese version of superslap

## Usage

Send any of the slap commands to the channel where the bot is present:

```none
!slapanus
```

The bot will select a random vulnerable user in the channel and perform the slap animation, which may include kicking the user depending on the command variant.

## Configuration

To deploy the superslap module, add it to your bot's `botModules` configuration with `moduleName: "superslap"`:

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
```
