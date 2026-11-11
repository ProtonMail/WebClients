import type { ReactNode } from 'react'

/** The host's notification function, injected. A notification without a type is a success. */
export type CreateNotification = (options: { type?: 'error' | 'success'; text: ReactNode }) => void
