import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { getContact, getParsedDateTime } from '../../emergencyContact/helper';
import {
    DelegatedAccessStateEnum,
    DelegatedAccessTypeEnum,
    type OutgoingDelegatedAccessOutput,
    type OutgoingEphemeral,
} from '../../interface';

export const getIsRecoveryContact = (value: OutgoingDelegatedAccessOutput) => {
    // Can be both emergency contact and recovery contact
    if (hasBit(value.Types, DelegatedAccessTypeEnum.SocialRecovery)) {
        return true;
    }
};

export const getIsEmergencyContact = (value: OutgoingDelegatedAccessOutput) => {
    // Can be both emergency contact and recovery contact
    if (hasBit(value.Types, DelegatedAccessTypeEnum.EmergencyAccess)) {
        return true;
    }
};

export const getParsedOutgoingDelegatedAccess = (
    value: OutgoingDelegatedAccessOutput,
    contactEmail: ContactEmail | undefined
) => {
    const accessibleAtDate = getParsedDateTime(value.AccessibleTime);
    const accessibleTriggerDelayMs = (value.TriggerDelay || 0) * 1000;
    const createdAtMs = (value.CreateTime || 0) * 1000;
    const email = value.TargetEmail || '';
    const isEnabled = value.State === DelegatedAccessStateEnum.Enabled;
    const isDisabled = value.State === DelegatedAccessStateEnum.Disabled;
    const recoverableAtDate = getParsedDateTime(value.RecoverableTime);

    return {
        contact: getContact(email, contactEmail),
        createdAtDate: new Date(createdAtMs),
        accessibleAtDate,
        accessibleTriggerDelayMs,
        recoverableAtDate,
        isDisabled,
        isEnabled,
        isRecoveryContact: getIsRecoveryContact(value),
        isEmergencyContact: getIsEmergencyContact(value),
    };
};

export const getCanOutgoingDelegatedAccessRecoverStep1 = ({
    parsedOutgoingDelegatedAccess,
}: ReturnType<typeof getEnrichedOutgoingDelegatedAccess>) => {
    return Boolean(parsedOutgoingDelegatedAccess.isRecoveryContact && parsedOutgoingDelegatedAccess.isEnabled);
};

export const getCanOutgoingDelegatedAccessRecoverStep2 = (
    value: ReturnType<typeof getEnrichedOutgoingDelegatedAccess>
) => {
    return Boolean(
        value.parsedOutgoingDelegatedAccess.isRecoveryContact &&
        value.outgoingDelegatedAccess.State === DelegatedAccessStateEnum.Recoverable &&
        value.outgoingDelegatedAccess.RecoveryToken
    );
};

export const getEnrichedOutgoingDelegatedAccess = (
    value: OutgoingDelegatedAccessOutput,
    contactEmail: ContactEmail | undefined,
    ephemeral: OutgoingEphemeral
) => {
    const parsedOutgoingDelegatedAccess = getParsedOutgoingDelegatedAccess(value, contactEmail);
    const id = value.DelegatedAccessID;
    return {
        outgoingDelegatedAccess: value,
        parsedOutgoingDelegatedAccess,
        loading: {
            recover: ephemeral[`${id}-recover`] ?? false,
            recoverToken: ephemeral[`${id}-recover-token`] ?? false,
            enable: ephemeral[`${id}-enable`] ?? false,
        },
    };
};

export const getMetaOutgoingDelegatedAccess = ({
    now,
    value,
    value: {
        parsedOutgoingDelegatedAccess: { isDisabled, accessibleAtDate },
    },
    userContext,
}: {
    now: number;
    value: ReturnType<typeof getEnrichedOutgoingDelegatedAccess>;
    userContext: {
        hasInactiveKeys: boolean | null;
    };
}) => {
    const canRequestAccess = accessibleAtDate === null;
    const accessibleAt = accessibleAtDate !== null ? accessibleAtDate.getTime() : null;
    const accessibleAtTimeDiff = accessibleAt !== null ? accessibleAt - now : null;

    const hasRequestedAccess = accessibleAtTimeDiff !== null && accessibleAtTimeDiff > 0;
    const canLogin = accessibleAtTimeDiff !== null && accessibleAtTimeDiff <= 0;
    const canRejectAccess = accessibleAtTimeDiff !== null && accessibleAtTimeDiff <= 0;

    return {
        accessibleAtTimeDiff,
        hasRequestedAccess,
        canLogin: !isDisabled && canLogin,
        canRequestAccess: !isDisabled && canRequestAccess,
        canRecoverStep1: getCanOutgoingDelegatedAccessRecoverStep1(value) && userContext?.hasInactiveKeys === true,
        canRecoverStep2: getCanOutgoingDelegatedAccessRecoverStep2(value) && userContext?.hasInactiveKeys === true,
        canDelete: true,
        canChangeWaitTime: true,
        canGrantAccess: hasRequestedAccess,
        canRefuseAccess: !isDisabled && hasRequestedAccess,
        canRevokeAccess: !isDisabled && canLogin,
        canReEnable: isDisabled,
        canRejectAccess,
    };
};
