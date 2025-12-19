import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { getContact, getParsedAccessibleTime } from '../../emergencyContact/helper';
import {
    DelegatedAccessStateEnum,
    DelegatedAccessTypeEnum,
    type IncomingDelegatedAccessOutput,
    type IncomingEphemeral,
} from '../../interface';

export const getDelegatedAccessType = (value: IncomingDelegatedAccessOutput) => {
    if (value.Types === DelegatedAccessTypeEnum.SocialRecovery) {
        return DelegatedAccessTypeEnum.SocialRecovery;
    }
    if (hasBit(value.Types, DelegatedAccessTypeEnum.EmergencyAccess)) {
        return DelegatedAccessTypeEnum.EmergencyAccess;
    }
    // Unknown type
    return null;
};

export const getParsedIncomingDelegatedAccess = (
    value: IncomingDelegatedAccessOutput,
    contactEmail: ContactEmail | undefined
) => {
    const email = value.SourceEmail || '';
    const accessibleAtDate = getParsedAccessibleTime(value.AccessibleTime);
    const accessibleTriggerDelayMs = (value.TriggerDelay || 0) * 1000;
    const createdAtMs = (value.CreateTime || 0) * 1000;
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

export const getEnrichedIncomingDelegatedAccess = (
    value: IncomingDelegatedAccessOutput,
    contactEmail: ContactEmail | undefined,
    ephemeral: IncomingEphemeral
) => {
    const parsedIncomingDelegatedAccess = getParsedIncomingDelegatedAccess(value, contactEmail);
    const id = value.DelegatedAccessID;
    return {
        incomingDelegatedAccess: value,
        parsedIncomingDelegatedAccess,
        loading: {
            access: ephemeral[`${id}-access`] ?? false,
        },
    };
};

export const getMetaIncomingDelegatedAccess = ({
    now,
    value: {
        parsedIncomingDelegatedAccess: { isDisabled, accessibleAtDate, type },
    },
}: {
    now: number;
    value: ReturnType<typeof getEnrichedIncomingDelegatedAccess>;
}) => {
    const canRequestAccess = accessibleAtDate === null;
    const accessibleAt = accessibleAtDate !== null ? accessibleAtDate.getTime() : null;
    const accessibleAtTimeDiff = accessibleAt !== null ? accessibleAt - now : null;

    const hasRequestedAccess = accessibleAtTimeDiff !== null && accessibleAtTimeDiff > 0;
    const canLogin = accessibleAtTimeDiff !== null && accessibleAtTimeDiff <= 0;

    return {
        accessibleAtTimeDiff,
        hasRequestedAccess,
        canLogin: !isDisabled && canLogin,
        canRequestAccess: !isDisabled && canRequestAccess,
        canCancelRequestAccess: !isDisabled && hasRequestedAccess,
        canDelete: true,
        canRecover: type === DelegatedAccessTypeEnum.SocialRecovery,
    };
};
