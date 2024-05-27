import {
  ELEMENT_TRANSFORMERS,
  ElementTransformer,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  TextFormatTransformer,
  TextMatchTransformer,
  Transformer,
} from '@lexical/markdown'

function indexBy<T>(list: T[], callback: (arg0: T) => string): Readonly<Record<string, T[]>> {
  const index: Record<string, T[]> = {}

  for (const item of list) {
    const key = callback(item)

    if (index[key]) {
      index[key].push(item)
    } else {
      index[key] = [item]
    }
  }

  return index
}

export function transformersByType(transformers: Transformer[]): Readonly<{
  element: ElementTransformer[]
  textFormat: TextFormatTransformer[]
  textMatch: TextMatchTransformer[]
}> {
  const byType = indexBy(transformers, (t) => t.type)

  return {
    element: (byType.element || []) as ElementTransformer[],
    textFormat: (byType['text-format'] || []) as TextFormatTransformer[],
    textMatch: (byType['text-match'] || []) as TextMatchTransformer[],
  }
}

export const TRANSFORMERS: Transformer[] = [
  ...ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
]
