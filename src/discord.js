const { MessageFlags, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, ContainerBuilder, WebhookClient } = require('discord.js')
const MAX_MESSAGE_LENGTH = 175

function sanitizeRepoName(repo) {
  // Check if repo contains "discord" (case-insensitive)
  if (repo.toLowerCase().includes('discord')) {
    // Replace "discord" with "chat" (case-insensitive)
    return repo.replace(/discord/gi, 'stripped')
  }
  return repo
}

module.exports.send = (id, token, repo, url, commits, size, pusher) =>
  new Promise((resolve, reject) => {
    let client
    const sanitizedRepo = sanitizeRepoName(repo)
    const username = 'Github Commits ' + sanitizedRepo
    console.log('Preparing Webhook...')
    try {
      client = new WebhookClient({
        id: id,
        token: token,
      })
      client
        .send({
          username: username,
          avatarURL: `https://github.com/${pusher}.png?size=64`,
          withComponents: true,
          flags: MessageFlags.IsComponentsV2,
          components: createEmbed(url, commits, size, pusher),
        })
        .then(() => {
          console.log('Successfully sent the message! ')
          resolve()
        }, reject)
    } catch (error) {
      console.log('Error creating Webhook')
      console.log(error)
      reject(error.message)
      return
    }
  })

function createEmbed(url, commits, size, pusher) {
  console.log('Constructing Embed...')
  console.log('Commits :')
  console.log(commits)
  if (!commits || commits.length === 0) {
    console.log('No commits, skipping...')
    return []
  }
  const latest = commits[0]
  const components = [
          new ContainerBuilder()
              .setAccentColor(821229)
              .addSectionComponents(
                  new SectionBuilder()
                      .setThumbnailAccessory(
                          new ThumbnailBuilder()
                              .setURL(`https://github.com/${pusher}.png?size=64`)
                              .setDescription(`⚡ ${pusher} pushed ${size} commit${size === 1 ? '' : 's'}`)
                      )
                      .addTextDisplayComponents(
                          new TextDisplayBuilder().setContent("# Commits"),
                      ),
              )
              .addSeparatorComponents(
                  new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
              )
              .addTextDisplayComponents(
                  new TextDisplayBuilder().setContent(`${getChangeLog(commits, size)}`),
              )
              .addSeparatorComponents(
                  new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
              )
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(new Date(latest.timestamp).toLocaleString()),
              ),
  ];

  return components;
  
}

function getChangeLog(commits, size) {
  let changelog = ''
  for (const i in commits) {
    if (i > 7) {
      changelog += `+ ${size - i} more...\n`
      break
    }

    const commit = commits[i]
    const sha = commit.id.substring(0, 6)
    const message =
      commit.message.length > MAX_MESSAGE_LENGTH
        ? commit.message.substring(0, MAX_MESSAGE_LENGTH) + '...'
        : commit.message
    changelog += `[\`${sha}\`](${commit.url}) — ${message} ([\`${commit.author.username}\`](https://github.com/${commit.author.username}))\n`
  }

  return changelog
}
