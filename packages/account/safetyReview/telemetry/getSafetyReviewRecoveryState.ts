import type { selectEnrichedOutgoingDelegatedAccess } from '../../delegatedAccess/shared/outgoing/selector';
import type { selectAccountRecovery } from '../../recovery/accountRecovery';
import type { selectMnemonicData } from '../../recovery/mnemonic';
import type { selectRecoveryFileData } from '../../recovery/recoveryFile';
import type { SafetyReviewRecoveryState } from './interfaces';

export const getSafetyReviewRecoveryState = ({
    accountRecovery,
    mnemonicData,
    recoveryFileData,
    outgoingDelegatedAccess,
}: {
    accountRecovery: ReturnType<typeof selectAccountRecovery>;
    mnemonicData: ReturnType<typeof selectMnemonicData>;
    recoveryFileData: ReturnType<typeof selectRecoveryFileData>;
    outgoingDelegatedAccess: ReturnType<typeof selectEnrichedOutgoingDelegatedAccess>;
}): SafetyReviewRecoveryState => ({
    email: {
        isEnabled: accountRecovery.emailRecovery.perfect,
        hasValue: !!accountRecovery.emailRecovery.value,
    },
    phone: {
        isEnabled: accountRecovery.phoneRecovery.perfect,
        hasValue: !!accountRecovery.phoneRecovery.value,
    },
    deviceRecovery: {
        isAvailable: recoveryFileData.isRecoveryFileAvailable,
        isEnabled: recoveryFileData.hasDeviceRecoveryEnabled,
    },
    phrase: { isAvailable: mnemonicData.isMnemonicAvailable, isSet: mnemonicData.isMnemonicSet },
    recoveryContactsData: {
        isAvailable: outgoingDelegatedAccess.isAvailable,
        isEnabled: outgoingDelegatedAccess.isAvailable && outgoingDelegatedAccess.recoveryContacts.items.length > 0,
    },
    emergencyContactsData: {
        isAvailable: outgoingDelegatedAccess.isAvailable,
        isEnabled: outgoingDelegatedAccess.isAvailable && outgoingDelegatedAccess.emergencyContacts.items.length > 0,
    },
});
