import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createTextNode, $getRoot, $isParagraphNode, $createParagraphNode } from 'lexical'
import { useEffect, useCallback, useRef } from 'react'

type Props = {
  enabled: boolean
  position: 'beginning' | 'end'
  additionLength?: number
  delayBetweenAdditions?: number
}

export default function TypingBotPlugin({
  enabled,
  position,
  additionLength = 25,
  delayBetweenAdditions = 300,
}: Props): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const insertTextInDocument = useCallback(() => {
    editor.update(() => {
      const root = $getRoot()
      const targetNode = position === 'beginning' ? root.getFirstChild() : root.getLastChild()

      const text = generateRandomString(additionLength)

      if (targetNode && $isParagraphNode(targetNode)) {
        targetNode.append($createTextNode(text))
      } else {
        const paragraph = $createParagraphNode()
        paragraph.append($createTextNode(text))
        if (position === 'beginning') {
          root.insertAfter(paragraph)
        } else {
          root.append(paragraph)
        }
      }
    })
  }, [editor, position, additionLength])

  const beginTyping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    intervalRef.current = setInterval(() => {
      insertTextInDocument()
    }, delayBetweenAdditions)
  }, [delayBetweenAdditions, insertTextInDocument])

  const stopTyping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      setTimeout(() => {
        beginTyping()
      }, 500)
    } else {
      stopTyping()
    }
  }, [beginTyping, enabled, stopTyping])

  return null
}

const LOWER_CASE_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')
const CHARACTER_SET = [...LOWER_CASE_LETTERS]
const CHARACTER_SET_LENGTH = CHARACTER_SET.length

export function generateRandomString(length: number): string {
  const buffer = new Uint8Array(length)
  window.crypto.getRandomValues(buffer)
  return [...buffer].map((x) => CHARACTER_SET[x % CHARACTER_SET_LENGTH]).join('')
}
