import { Result } from '../../Utils/Result'
import type { EmojiMartData } from '@emoji-mart/data'

export type Emoji = {
  id: string
  name: string
  native: string
  category: string
  names: string[]
  keywords: string[]
}

let pending: Promise<Result<Emoji[]>> | undefined

export function loadEmojis(): Promise<Result<Emoji[]>> {
  if (!pending) {
    pending = import(/* webpackChunkName: "docs-emoji-data" */ '@emoji-mart/data/sets/15/native.json')
      .then((module) => {
        const data: EmojiMartData = module.default
        return Result.ok(
          data.categories.flatMap((category) =>
            category.emojis.flatMap((id) => {
              const emoji = data.emojis[id]
              if (!emoji || emoji.version > 14 || !emoji.skins[0]?.native) {
                return []
              }
              return [
                {
                  id,
                  name: emoji.name,
                  native: emoji.skins[0].native,
                  category: category.id,
                  names: [id, ...Object.keys(data.aliases).filter((alias) => data.aliases[alias] === id)],
                  keywords: emoji.keywords,
                },
              ]
            }),
          ),
        )
      })
      .catch((error: unknown) => {
        pending = undefined
        return Result.fail(error instanceof Error ? error.message : 'Could not load emoji data')
      })
  }
  return pending
}

export function searchEmojis(emojis: Emoji[], query: string, recent: string[]): Emoji[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (!words.length) {
    return emojis
  }
  return emojis
    .filter((emoji) =>
      words.every((word) =>
        [...emoji.names, emoji.name, ...emoji.keywords].some((name) => name.toLowerCase().includes(word)),
      ),
    )
    .sort((a, b) => {
      const score = (emoji: Emoji) =>
        (emoji.names.includes(query.toLowerCase()) ? 100 : 0) +
        (emoji.names.some((name) => name.startsWith(query.toLowerCase())) ? 20 : 0) +
        Math.max(0, 12 - recent.indexOf(emoji.id)) * Number(recent.includes(emoji.id))
      return score(b) - score(a)
    })
}
