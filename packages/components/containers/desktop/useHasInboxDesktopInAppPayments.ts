import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { useFlag } from '@proton/unleash/useFlag';

const isInboxDesktopInAppPaymentsEnabled = (flagEnabled: boolean): boolean =>
    isElectronApp && hasInboxDesktopFeature('InAppPayments') && flagEnabled;

export function useHasInboxDesktopInAppPayments() {
    const hasInAppPaymentsFlag = useFlag('InboxDesktopInAppPayments');
    return isInboxDesktopInAppPaymentsEnabled(hasInAppPaymentsFlag);
}
