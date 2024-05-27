import { ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  children: ReactNode
  container?: HTMLElement | undefined | null
  disabled?: boolean
}

const Portal = ({ children, container, disabled = false }: Props) => {
  if (disabled) {
    return <>{children}</>
  }

  return createPortal(children, container || document.body)
}

export default Portal
