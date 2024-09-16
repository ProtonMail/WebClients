type Segment = {
  index: number
  isWordLike: boolean
  segment: string
}

export function polyfillSelectionRelatedThingsForTests() {
  // https://github.com/facebook/lexical/blob/main/packages/lexical-selection/src/__tests__/unit/LexicalSelection.test.tsx#L100
  Range.prototype.getBoundingClientRect = function (): DOMRect {
    const rect = {
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
    }
    return {
      ...rect,
      toJSON() {
        return rect
      },
    }
  }

  // https://github.com/facebook/lexical/blob/main/packages/lexical-selection/src/__tests__/utils/index.ts#L35
  if (!Selection.prototype.modify) {
    const wordBreakPolyfillRegex = /[\s.,\\/#!$%^&*;:{}=\-`~()\uD800-\uDBFF\uDC00-\uDFFF\u3000-\u303F]/u

    const pushSegment = function (segments: Segment[], index: number, str: string, isWordLike: boolean): void {
      segments.push({
        index: index - str.length,
        isWordLike,
        segment: str,
      })
    }

    const getWordsFromString = function (string: string): Segment[] {
      const segments: Segment[] = []
      let wordString = ''
      let nonWordString = ''
      let i

      for (i = 0; i < string.length; i++) {
        const char = string[i]

        if (wordBreakPolyfillRegex.test(char)) {
          if (wordString !== '') {
            pushSegment(segments, i, wordString, true)
            wordString = ''
          }

          nonWordString += char
        } else {
          if (nonWordString !== '') {
            pushSegment(segments, i, nonWordString, false)
            nonWordString = ''
          }

          wordString += char
        }
      }

      if (wordString !== '') {
        pushSegment(segments, i, wordString, true)
      }

      if (nonWordString !== '') {
        pushSegment(segments, i, nonWordString, false)
      }

      return segments
    }

    Selection.prototype.modify = function (alter, direction, granularity) {
      // This is not a thorough implementation, it was more to get tests working
      // given the refactor to use this selection method.
      const symbol = Object.getOwnPropertySymbols(this)[0]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const impl = (this as any)[symbol]
      const focus = impl._focus
      const anchor = impl._anchor

      if (granularity === 'character') {
        let anchorNode = anchor.node
        let anchorOffset = anchor.offset
        let _$isTextNode = false

        if (anchorNode.nodeType === 3) {
          _$isTextNode = true
          anchorNode = anchorNode.parentElement
        } else if (anchorNode.nodeName === 'BR') {
          const parentNode = anchorNode.parentElement
          const childNodes = Array.from(parentNode.childNodes)
          anchorOffset = childNodes.indexOf(anchorNode)
          anchorNode = parentNode
        }

        if (direction === 'backward') {
          if (anchorOffset === 0) {
            let prevSibling = anchorNode.previousSibling

            if (prevSibling === null) {
              prevSibling = anchorNode.parentElement.previousSibling.lastChild
            }

            if (prevSibling.nodeName === 'P') {
              prevSibling = prevSibling.firstChild
            }

            if (prevSibling.nodeName === 'BR') {
              anchor.node = prevSibling
              anchor.offset = 0
            } else {
              anchor.node = prevSibling.firstChild
              anchor.offset = anchor.node.nodeValue.length - 1
            }
          } else if (!_$isTextNode) {
            anchor.node = anchorNode.childNodes[anchorOffset - 1]
            anchor.offset = anchor.node.nodeValue.length - 1
          } else {
            anchor.offset--
          }
        } else {
          if (
            (_$isTextNode && anchorOffset === anchorNode.textContent.length) ||
            (!_$isTextNode &&
              (anchorNode.childNodes.length === anchorOffset ||
                (anchorNode.childNodes.length === 1 && anchorNode.firstChild.nodeName === 'BR')))
          ) {
            let nextSibling = anchorNode.nextSibling

            if (nextSibling === null) {
              nextSibling = anchorNode.parentElement.nextSibling.lastChild
            }

            if (nextSibling.nodeName === 'P') {
              nextSibling = nextSibling.lastChild
            }

            if (nextSibling.nodeName === 'BR') {
              anchor.node = nextSibling
              anchor.offset = 0
            } else {
              anchor.node = nextSibling.firstChild
              anchor.offset = 0
            }
          } else {
            anchor.offset++
          }
        }
      } else if (granularity === 'word') {
        const anchorNode = this.anchorNode!
        const targetTextContent =
          direction === 'backward'
            ? anchorNode.textContent!.slice(0, this.anchorOffset)
            : anchorNode.textContent!.slice(this.anchorOffset)
        const segments = getWordsFromString(targetTextContent)
        const segmentsLength = segments.length
        let index = anchor.offset
        let foundWordNode = false

        if (direction === 'backward') {
          for (let i = segmentsLength - 1; i >= 0; i--) {
            const segment = segments[i]
            const nextIndex = segment.index

            if (segment.isWordLike) {
              index = nextIndex
              foundWordNode = true
            } else if (foundWordNode) {
              break
            } else {
              index = nextIndex
            }
          }
        } else {
          for (let i = 0; i < segmentsLength; i++) {
            const segment = segments[i]
            const nextIndex = segment.index + segment.segment.length

            if (segment.isWordLike) {
              index = nextIndex
              foundWordNode = true
            } else if (foundWordNode) {
              break
            } else {
              index = nextIndex
            }
          }
        }

        if (direction === 'forward') {
          index += anchor.offset
        }

        anchor.offset = index
      }

      if (alter === 'move') {
        focus.offset = anchor.offset
        focus.node = anchor.node
      }
    }
  }
}
