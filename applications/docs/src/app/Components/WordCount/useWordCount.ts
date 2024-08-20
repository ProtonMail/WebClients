import { useContext } from 'react'
import { WordCountContext } from './WordCountProvider'

export const useWordCount = () => {
  const wordCountContext = useContext(WordCountContext)
  return wordCountContext.wordCountInfoCollection
}
