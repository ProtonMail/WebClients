import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { useFlag, type useGetFlag } from '@proton/unleash';

const isInboxDesktopInAppPaymentsEnabled = (flagEnabled: boolean): boolean =>
    isElectronApp && hasInboxDesktopFeature('InAppPayments') && flagEnabled;

export const getHasInboxDesktopInAppPayments = (getFlag: ReturnType<typeof useGetFlag>) => {
    const hasInAppPaymentsFlag = getFlag('InboxDesktopInAppPayments');
    return isInboxDesktopInAppPaymentsEnabled(hasInAppPaymentsFlag);
};

export function useHasInboxDesktopInAppPayments() {
    const hasInAppPaymentsFlag = useFlag('InboxDesktopInAppPayments');
    return isInboxDesktopInAppPaymentsEnabled(hasInAppPaymentsFlag);
}
