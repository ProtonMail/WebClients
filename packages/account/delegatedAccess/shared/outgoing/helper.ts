import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { getContact, getParsedAccessibleTime } from '../../emergencyContact/helper';
import { DelegatedAccessStateEnum, DelegatedAccessTypeEnum, type OutgoingDelegatedAccessOutput } from '../../interface';

export const getDelegatedAccessType = (value: OutgoingDelegatedAccessOutput) => {
    if (value.Types === DelegatedAccessTypeEnum.SocialRecovery) {
        return DelegatedAccessTypeEnum.SocialRecovery;
    }
    if (hasBit(value.Types, DelegatedAccessTypeEnum.EmergencyAccess)) {
        return DelegatedAccessTypeEnum.EmergencyAccess;
    }
    // Unknown type
    return null;
};

export const getParsedOutgoingDelegatedAccess = (
    value: OutgoingDelegatedAccessOutput,
    contactEmail: ContactEmail | undefined
) => {
    const accessibleAtDate = getParsedAccessibleTime(value.AccessibleTime);
    const accessibleTriggerDelayMs = (value.TriggerDelay || 0) * 1000;
    const createdAtMs = (value.CreateTime || 0) * 1000;
    const email = value.TargetEmail || '';
    const isDisabled = value.State === DelegatedAccessStateEnum.Disabled;

    return {
        contact: getContact(email, contactEmail),
        createdAtDate: new Date(createdAtMs),
        accessibleAtDate,
        accessibleTriggerDelayMs,
        isDisabled,
        type: getDelegatedAccessType(value),
    };
};

export const getEnrichedOutgoingDelegatedAccess = (
    value: OutgoingDelegatedAccessOutput,
    contactEmail: ContactEmail | undefined
) => {
    const parsedOutgoingDelegatedAccess = getParsedOutgoingDelegatedAccess(value, contactEmail);
    return {
        outgoingDelegatedAccess: value,
        parsedOutgoingDelegatedAccess,
    };
};

export const getMetaOutgoingDelegatedAccess = ({
    now,
    value: {
        parsedOutgoingDelegatedAccess: { isDisabled, accessibleAtDate },
    },
}: {
    now: number;
    value: ReturnType<typeof getEnrichedOutgoingDelegatedAccess>;
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
        canDelete: true,
        canChangeWaitTime: true,
        canGrantAccess: hasRequestedAccess,
        canRefuseAccess: !isDisabled && hasRequestedAccess,
        canRevokeAccess: !isDisabled && canLogin,
        canRejectAccess,
    };
};
