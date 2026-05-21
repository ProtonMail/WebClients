import { useEarlyAccess } from '@proton/components';
import { isMobile } from '@proton/shared/lib/helpers/browser';

export default function useIsEditEnabled() {
    const { currentEnvironment } = useEarlyAccess();
    return currentEnvironment === 'alpha' && !isMobile();
}
