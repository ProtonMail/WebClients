import type { FormEvent } from 'react'
import { useState } from 'react'

import { c } from 'ttag'

import { Button } from '@proton/atoms/Button/Button'
import { Icon, InputFieldTwo, PasswordInputTwo } from '@proton/components'
import { useLoading } from '@proton/hooks'

export type PasswordPageProps = {
  submitPassword: (password: string) => Promise<void>
}

export function PasswordPage({ submitPassword }: PasswordPageProps) {
  const [loading, withLoading] = useLoading(false)
  const [password, setPassword] = useState('')

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault()
    void withLoading(submitPassword(password))
  }

  return (
    <div className="mb-14 flex min-h-screen flex-1 items-center justify-center py-7">
      <div
        className="password-page--form-container ui-standard shadow-lifted max-w-custom relative mx-auto w-full rounded px-8 py-11"
        style={{ '--max-w-custom': '30rem' }}
      >
        <div className="flex justify-center pb-7">
          <span className="rounded bg-[--interaction-norm-minor-1] p-4">
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
