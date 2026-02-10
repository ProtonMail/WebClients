import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { getContact, getParsedDateTime } from '../../emergencyContact/helper';
import {
    DelegatedAccessStateEnum,
    DelegatedAccessTypeEnum,
    type IncomingDelegatedAccessOutput,
    type IncomingEphemeral,
} from '../../interface';

export const getIsRecoveryContact = (value: IncomingDelegatedAccessOutput) => {
    if (hasBit(value.Types, DelegatedAccessTypeEnum.SocialRecovery)) {
        return true;
    }
};

export const getIsEmergencyContact = (value: IncomingDelegatedAccessOutput) => {
    if (hasBit(value.Types, DelegatedAccessTypeEnum.EmergencyAccess)) {
        return true;
    }
};

export const getParsedIncomingDelegatedAccess = (
    value: IncomingDelegatedAccessOutput,
    contactEmail: ContactEmail | undefined
) => {
    const email = value.SourceEmail || '';
    const accessibleAtDate = getParsedDateTime(value.AccessibleTime);
    const accessibleTriggerDelayMs = (value.TriggerDelay || 0) * 1000;
    const createdAtMs = (value.CreateTime || 0) * 1000;
    const isEnabled = value.State === DelegatedAccessStateEnum.Enabled;
    const isDisabled = value.State === DelegatedAccessStateEnum.Disabled;

    return {
        contact: getContact(email, contactEmail),
        createdAtDate: new Date(createdAtMs),
        accessibleAtDate,
        accessibleTriggerDelayMs,
        isEnabled,
        isDisabled,
        isRecoveryContact: getIsRecoveryContact(value),
        isEmergencyContact: getIsEmergencyContact(value),
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

export const getCanIncomingDelegatedAccessRecover = ({
    incomingDelegatedAccess,
    parsedIncomingDelegatedAccess,
}: ReturnType<typeof getEnrichedIncomingDelegatedAccess>) => {
    return (
        parsedIncomingDelegatedAccess.isRecoveryContact &&
        incomingDelegatedAccess.State === DelegatedAccessStateEnum.Recoverable &&
        !incomingDelegatedAccess.RecoveryToken
    );
};

export const getMetaIncomingDelegatedAccess = ({
    now,
    value,
    value: {
        parsedIncomingDelegatedAccess: { isDisabled, accessibleAtDate },
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
        canRecover: getCanIncomingDelegatedAccessRecover(value),
    };
};
