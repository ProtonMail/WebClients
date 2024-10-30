import type { FormEvent } from 'react'
import { useState } from 'react'

import { c } from 'ttag'

import { Button } from '@proton/atoms'
import { Icon, InputFieldTwo, PasswordInputTwo } from '@proton/components'
import { useLoading } from '@proton/hooks'

import './PasswordPage.scss'

interface Props {
  submitPassword: (password: string) => Promise<void>
}

export default function PasswordPage({ submitPassword }: Props) {
  const [loading, withLoading] = useLoading(false)
  const [password, setPassword] = useState('')

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault()
    void withLoading(submitPassword(password))
  }

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen py-7 mb-14">
      <div
        className="password-page--form-container ui-standard shadow-lifted max-w-custom relative mx-auto w-full rounded px-8 py-11"
        style={{ '--max-w-custom': '30rem' }}
      >
        <div className="flex justify-center pb-7">
          <span className="password-page--icon-container rounded p-4">
            <Icon name="key-skeleton" className="color-primary" size={7} />
          </span>
        </div>
        <h3 className="text-bold mb-2 text-center">{c('Title').t`This document is password protected`}</h3>
        <p className="mt-0 text-center">{c('Info').t`Please enter the password to decrypt and view content.`}</p>
        <form className="mt-8 w-full" autoComplete="off" onSubmit={handlePasswordSubmit}>
          <div className="mb-8 mt-4">
            <InputFieldTwo
              bigger
              as={PasswordInputTwo}
              label={c('Label').t`Password`}
              autoComplete="off"
              id="password"
              disabled={loading}
              value={password}
              onValue={setPassword}
              placeholder={c('Info').t`Enter password`}
              assistiveText={c('Info').t`Document owner has the password`}
            />
          </div>
          <Button size="large" fullWidth color="norm" disabled={!password} loading={loading} type="submit">
            {c('Action').t`Continue`}
          </Button>
        </form>
      </div>
    </div>
  )
}
