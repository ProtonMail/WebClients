import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import type { IncomingDelegatedAccessOutput, IncomingEphemeral } from '../../interface';
import { getContact, getParsedAccessibleTime } from '../helper';

export const getParsedIncomingDelegatedAccess = (
    value: IncomingDelegatedAccessOutput,
    contactEmail: ContactEmail | undefined
) => {
    const email = value.SourceEmail || '';
    const accessibleAtDate = getParsedAccessibleTime(value.AccessibleTime);
    const accessibleTriggerDelayMs = (value.TriggerDelay || 0) * 1000;
    const createdAtMs = (value.CreateTime || 0) * 1000;

    return {
        contact: getContact(email, contactEmail),
        createdAtDate: new Date(createdAtMs),
        accessibleAtDate,
        accessibleTriggerDelayMs,
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
        parsedIncomingDelegatedAccess: { accessibleAtDate },
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
        canLogin,
        canRequestAccess,
        canDelete: true,
    };
};
