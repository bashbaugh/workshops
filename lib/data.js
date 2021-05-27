const fs = require('fs')
const matter = require('gray-matter')
const manifest = require('../manifest.json')
const markdownToHtml = require('@hackclub/markdown')
const { getEditUrl, getRawFileFromRepo } = require('./github')
const { trim, dropRightWhile } = require('lodash')

export const getWorkshopSlugs = () => {
  try {
    return fs
      .readdirSync('./public/content/workshops/')
      .filter(path => !['img', 'lib', 'README.md'].includes(path))
  } catch {
    return fs
      .readdirSync('./content/workshops/')
      .filter(path => !['img', 'lib', 'README.md'].includes(path))
  }
}

export const getWorkshopFile = slug => {
  try {
    return fs.readFileSync(
      `./public/content/workshops/${slug}/README.md`,
      'utf8'
    )
  } catch {
    return fs.readFileSync(`./content/workshops/${slug}/README.md`, 'utf8')
  }
}

export const getNewsletterSlugs = () => {
  try {
    return fs
      .readdirSync('./public/vip-newsletters/')
      .filter(path => !['README.md'].includes(path))
  } catch {
    return fs
      .readdirSync('./vip-newsletters/')
      .filter(path => !['README.md'].includes(path))
  }
}

export const getNewsletterFile = slug => {
  try {
    return fs.readFileSync(`./public/vip-newsletters/${slug}/README.md`, 'utf8')
  } catch {
    return fs.readFileSync(`./vip-newsletters/${slug}/README.md`, 'utf8')
  }
}

export const getNewslettersHtml = async () => {
  let md
  try {
    md = fs.readFileSync(`./public/vip-newsletters/README.md`, 'utf8')
  } catch {
    md = fs.readFileSync(`./vip-newsletters/README.md`, 'utf8')
  }
  const html = await markdownToHtml(md, 'README.md', '', true)
  return html
}

export const getConductHtml = async () => {
  let md
  try {
    md = fs.readFileSync(`./public/content/CODE_OF_CONDUCT.md`, 'utf8')
  } catch {
    md = fs.readFileSync(`./content/CODE_OF_CONDUCT.md`, 'utf8')
  }
  const html = await markdownToHtml(md, 'CODE_OF_CONDUCT.md', '/content', true)
  return html
}

export const getBannerHtml = async () => {
  const md = await getRawFileFromRepo('README.md', 'master', 'hackclub/banner')
  const html = await markdownToHtml(md, 'README.md', '', true)
  return html
}

const tagCreator = tagString => {
  tagString = trim(tagString)

  if (tagString.length) {
    let tags = tagString.split(',').map(ele => trim(ele))
    const maxLim = tagString.length > 5 ? 5 : tagString.length
    tags = dropRightWhile(tags, (ele, idx) => idx != maxLim - 1)
    return tags
  }
  return []
}

export const getWorkshopSections = () =>
  Object.keys(manifest).map(key => {
    let workshops = []
    manifest[key].slugs.forEach(slug => {
      let md = getWorkshopFile(slug)
      let { name, description, img = null, tags = [] } = matter(md).data
      if (tags) tags = tagCreator(tags)
      workshops.push({ slug, name, description, img, tags })
    })
    return { ...manifest[key], key, workshops }
  })

export const getWorkshopData = async (slug, md, branch) => {
  const { content, data } = matter(md)
  const authors = (data?.author || '').includes('@')
    ? data?.author
        .replace(/@/g, ' ')
        .replace(/ad510/g, '') // user has no profile picture
        .split(',')
        .map(trim)
        .map(
          u => `&images=${encodeURIComponent(`https://github.com/${u}.png`)}`
        )
        .join('')
    : ''
  data.card = `https://workshop-cards.hackclub.com/${encodeURIComponent(
    data?.name
  )}.png?brand=Workshops${authors}&caption=${encodeURIComponent(
    `By ${data?.author}`
  )}`
  data.bg = `/api/patterns/${slug}`
  data.editUrl = getEditUrl(`workshops/${slug}/README.md`)
  const imgPath = branch
    ? `https://raw.githubusercontent.com/hackclub/hackclub/${branch}`
    : '/content'
  const html = await markdownToHtml(content, `workshops/${slug}`, imgPath, true)
  return { data, html }
}

export const getNewsletterData = async (slug, md) => {
  const avatars = ['christina', 'lachlan', 'zach']
    .map(
      n => `images=${encodeURIComponent('https://hackclub.com/team/')}${n}.jpg`
    )
    .join('&')
  const img = `https://workshop-cards.hackclub.com/VIP%20Newsletter%20${slug}.png?brand=HQ&${avatars}`
  const data = {
    title: `VIP Newsletter ${slug}`,
    img
  }
  // data.date = parseDate(md?.split('\n')?.[0])
  const html = await markdownToHtml(md, `vip-newsletters/${slug}`, '', true)
  return { data, html }
}
