import { useContext } from 'react'
import { WordCountContext } from './WordCountProvider'

export const useFloatingWordCount = () => {
  const { floatingUIIsEnabled, setFloatingUIIsEnabled } = useContext(WordCountContext)
  return { floatingUIIsEnabled, setFloatingUIIsEnabled }
}
