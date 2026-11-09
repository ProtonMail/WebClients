import { act, render, renderHook, screen } from '@testing-library/react'

import { WordCountOverlay, useWordCountState } from './WordCount'

const DOCUMENT = { wordCount: 3, characterCount: 15, nonWhitespaceCharacterCount: 13 }
const SELECTION = { wordCount: 1, characterCount: 5, nonWhitespaceCharacterCount: 5 }

describe('WordCountOverlay', () => {
  test('shows nothing until it is shown and the editor reported a count', () => {
    const { result } = renderHook(() => useWordCountState())
    const { rerender } = render(<WordCountOverlay wordCount={result.current[0]} />)
    expect(screen.queryByTestId('word-count-overlay')).not.toBeInTheDocument()

    act(() => result.current[0].setIsShown(true))
    rerender(<WordCountOverlay wordCount={result.current[0]} />)
    expect(screen.queryByTestId('word-count-overlay')).not.toBeInTheDocument()

    act(() => result.current[1]({ document: DOCUMENT }))
    rerender(<WordCountOverlay wordCount={result.current[0]} />)
    expect(screen.getByTestId('word-count-overlay')).toHaveTextContent('3 words')
  })

  test('shows the selected words out of the document words', () => {
    const { result } = renderHook(() => useWordCountState())
    act(() => {
      result.current[0].setIsShown(true)
      result.current[1]({ document: DOCUMENT, selection: SELECTION })
    })

    render(<WordCountOverlay wordCount={result.current[0]} />)

    expect(screen.getByTestId('word-count-overlay')).toHaveTextContent('1/3words')
  })
})
