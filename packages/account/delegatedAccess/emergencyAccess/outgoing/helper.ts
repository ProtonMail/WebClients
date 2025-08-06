import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import type { OutgoingDelegatedAccessOutput } from '../../interface';
import { getContact, getParsedAccessibleTime } from '../helper';

export const getParsedOutgoingDelegatedAccess = (
    value: OutgoingDelegatedAccessOutput,
    contactEmail: ContactEmail | undefined
) => {
    const accessibleAtDate = getParsedAccessibleTime(value.AccessibleTime);
    const accessibleTriggerDelayMs = (value.TriggerDelay || 0) * 1000;
    const createdAtMs = (value.CreateTime || 0) * 1000;
    const email = value.TargetEmail || '';

    return {
        contact: getContact(email, contactEmail),
        createdAtDate: new Date(createdAtMs),
        accessibleAtDate,
        accessibleTriggerDelayMs,
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
        parsedOutgoingDelegatedAccess: { accessibleAtDate },
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
        canLogin,
        canRequestAccess,
        canDelete: true,
        canChangeWaitTime: true,
        canGrantAccess: hasRequestedAccess,
        canRejectAccess,
    };
};
