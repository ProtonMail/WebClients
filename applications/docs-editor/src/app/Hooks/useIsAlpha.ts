import { useApplication } from '../Containers/ApplicationProvider'
import { isDevOrBlack } from '@proton/utils/env'

export function useIsAlpha() {
  const { application } = useApplication()
  return application.environment === 'alpha' || isDevOrBlack()
}
