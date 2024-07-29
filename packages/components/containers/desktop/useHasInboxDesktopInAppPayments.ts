import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { useFlag } from '@proton/unleash';

export function useHasInboxDesktopInAppPayments() {
    const hasInAppPaymentsFlag = useFlag('InboxDesktopInAppPayments');
    return isElectronApp && hasInboxDesktopFeature('InAppPayments') && hasInAppPaymentsFlag;
}
