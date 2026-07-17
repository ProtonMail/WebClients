import type { ComponentPropsWithoutRef } from 'react'

type Environment = 'alpha' | 'beta'

const envMap = {
  alpha: 'α',
  beta: 'β',
  relaunch: 'δ',
}

export interface VersionNumberProps extends ComponentPropsWithoutRef<'span'> {
  version: string
  environment: Environment | undefined
}

export function VersionNumber({ version, environment, ...rest }: VersionNumberProps) {
  const currentEnvDisplay = environment && envMap[environment] ? envMap[environment] : ''
  const versionString = version.split('+')[0]
  const currentVersionEnvDisplay = currentEnvDisplay ? `${versionString} ${currentEnvDisplay}` : `${versionString}`
  return <span {...rest}>{currentVersionEnvDisplay}</span>
}
