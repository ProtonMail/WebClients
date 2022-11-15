import { useEarlyAccess } from '@proton/components';

export default function useIsEditEnabled() {
    const { currentEnvironment } = useEarlyAccess();
    return currentEnvironment === 'alpha' || currentEnvironment === 'beta';
}
