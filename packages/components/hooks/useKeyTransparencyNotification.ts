import { ThemeColor } from '@proton/colors/types';
import type { SelfAuditResult } from '@proton/key-transparency/lib';
import { AddressAuditStatus, AddressAuditWarningReason } from '@proton/key-transparency/lib';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import { useKeyTransparencyContext } from '../containers/keyTransparency/useKeyTransparencyContext';

const getHasSelfAuditFailure = (selfAuditResult: SelfAuditResult) => {
    const addressAuditFailed = selfAuditResult.addressAuditResults.some(
        ({ status }) => status === AddressAuditStatus.Failure
    );
    if (addressAuditFailed) {
        return true;
    }
    const lsAuditOwnFailed = selfAuditResult.localStorageAuditResultsOwnAddress.some(({ success }) => !success);
    if (lsAuditOwnFailed) {
        return true;
    }
    const lsAuditOtherFailed = selfAuditResult.localStorageAuditResultsOtherAddress.some(({ success }) => !success);
    return lsAuditOtherFailed;
};

const getHasSelfAuditWarning = (selfAuditResult: SelfAuditResult) => {
    if (selfAuditResult?.error?.tooManyRetries) {
        return true;
    }
    const addressAuditWarning = selfAuditResult.addressAuditResults.some(
        ({ status, warningDetails }) =>
            status === AddressAuditStatus.Warning &&
            !(
                warningDetails?.reason === AddressAuditWarningReason.UnverifiableHistory &&
                !warningDetails.addressWasDisabled
            )
    );
    if (addressAuditWarning) {
        return true;
    }
};

const useKeyTransparencyNotification = (): ThemeColor | undefined => {
    const {
        ktState: { selfAuditResult },
        ktActivation,
    } = useKeyTransparencyContext();
    const showNotification = ktActivation === KeyTransparencyActivation.SHOW_UI && selfAuditResult;

    if (!showNotification) {
        return;
    }
    if (getHasSelfAuditFailure(selfAuditResult)) {
        return ThemeColor.Danger;
    }
    if (getHasSelfAuditWarning(selfAuditResult)) {
        return ThemeColor.Warning;
    }
};

export default useKeyTransparencyNotification;
