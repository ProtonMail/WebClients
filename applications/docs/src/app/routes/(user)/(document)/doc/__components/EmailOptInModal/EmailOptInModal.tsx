import { c } from 'ttag'

import { Button } from '@proton/atoms'
import type { ModalStateProps } from '@proton/components'
import { ModalTwo, ModalTwoContent, ModalTwoFooter, Toggle, useModalTwoStatic } from '@proton/components'
import useLoading from '@proton/hooks/useLoading'
import { useEffect, useState } from 'react'
import { useDocsNotifications } from '../../../../__utils/notifications-context'
import Hero from './hero.svg'

export function EmailOptInModal({ onClose, open, ...modalProps }: ModalStateProps) {
  const { updateNotificationSettings, emailTitleEnabled, emailNotificationsEnabled } = useDocsNotifications()

  const [isLoading, withLoading] = useLoading()
  const [isOpen, setIsOpen] = useState(open)

  const [notificationsSwitchEnabled, setNotificationsSwitchEnabled] = useState(emailNotificationsEnabled ?? true)
  const [docNameSwitchEnabled, setDocNameSwitchEnabled] = useState(emailTitleEnabled ?? true)

  useEffect(() => {
    setNotificationsSwitchEnabled(emailNotificationsEnabled ?? true)
    setDocNameSwitchEnabled(emailTitleEnabled ?? true)
  }, [emailNotificationsEnabled, emailTitleEnabled])

  const close = () => {
    setIsOpen(false)

    if (typeof onClose !== 'undefined') {
      onClose()
    }
  }

  const handleSavePreferences = async () => {
    try {
      await updateNotificationSettings({
        notificationsEnabled: notificationsSwitchEnabled,
        includeTitleEnabled: docNameSwitchEnabled,
      })
      close()
    } catch (error) {
      console.error('Failed to save preferences:', error)
    }
  }

  return (
    <ModalTwo
      className="!rounded-t-xl"
      data-testid="email-opt-in-modal"
      fullscreen={false}
      size="small"
      open={isOpen === undefined ? true : isOpen}
      onClose={close}
      {...modalProps}
    >
      <ModalTwoContent className="m-0 p-0">
        <div className="relative p-0">
          <img src={Hero} alt="Encrypted" className="no-select pointer-events-none left-0 top-0 w-full select-none" />
        </div>
        <div className="p-6">
          <h1 className="text-rg text-center font-bold">{c('Info').t`Get Notified About Comments`}</h1>
          <p className="mb-4 mt-2 text-center">{c('Info')
            .t`Get email updates for comments and suggestions added to your documents.`}</p>

          <div className="border-weak flex flex-col gap-4 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <span>{c('Label').t`Enable email notifications`}</span>
              <Toggle
                id="enable-notifications"
                data-testid="enable-notifications"
                checked={notificationsSwitchEnabled}
                onChange={({ target: { checked } }) => setNotificationsSwitchEnabled(checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span>{c('Label').t`Include document name in notification`}</span>
              <Toggle
                id="include-doc-name"
                data-testid="include-doc-name"
                checked={docNameSwitchEnabled}
                onChange={({ target: { checked } }) => setDocNameSwitchEnabled(checked)}
              />
            </div>
          </div>
        </div>
      </ModalTwoContent>

      <ModalTwoFooter>
        <div className="flex w-full flex-col gap-2">
          <Button
            color="norm"
            loading={isLoading}
            onClick={() => withLoading(handleSavePreferences())}
            data-testid="close-email-opt-in-modal"
          >
            {c('Action').t`Save preferences`}
          </Button>
          <Button shape="ghost" color="norm" onClick={close}>
            {c('Action').t`Ask me next time`}
          </Button>
        </div>
      </ModalTwoFooter>
    </ModalTwo>
  )
}

export function useEmailOptInModal() {
  return useModalTwoStatic(EmailOptInModal)
}
