import { useApplication } from '../Containers/ApplicationProvider'
import { useDocsDependencies } from '../Containers/Docs/DocsDependenciesProvider'

export function useIsAlpha() {
  const { application } = useApplication()
  const { isDevOrBlack } = useDocsDependencies()
  return application.environment === 'alpha' || isDevOrBlack()
}
