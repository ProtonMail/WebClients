import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { DelegatedAccessStateEnum, type IncomingDelegatedAccessOutput, type IncomingEphemeral } from '../../interface';
import { getContact, getParsedAccessibleTime } from '../helper';

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
        canDelete: true,
    };
};
