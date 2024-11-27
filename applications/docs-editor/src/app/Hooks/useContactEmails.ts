import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact'
import { useApplication } from '../ApplicationProvider'
import { useCallback, useEffect, useState } from 'react'

export function useContactEmails() {
  const { application } = useApplication()

  const [contactEmails, setContactEmails] = useState<ContactEmail[]>([])

  useEffect(() => {
    return application.syncedState.subscribeToProperty('contactEmails', (contactEmails) => {
      setContactEmails(contactEmails)
    })
  }, [application.syncedState])

  const contactForEmail = useCallback(
    (email: string) => {
      return contactEmails.find((contactEmail) => contactEmail.Email === email)
    },
    [contactEmails],
  )

  const displayNameForEmail = useCallback(
    (email: string) => {
      const contact = contactForEmail(email)

      return contact?.Name ?? email
    },
    [contactForEmail],
  )

  return {
    contactForEmail,
    displayNameForEmail,
  }
}
