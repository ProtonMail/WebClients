import { ThemeColor } from '@proton/colors/types';
import { AddressAuditStatus, SelfAuditResult } from '@proton/key-transparency/lib';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import { useKeyTransparencyContext } from '../containers';

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
        ({ status }) => status === AddressAuditStatus.Warning
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
