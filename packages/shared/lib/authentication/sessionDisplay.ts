import { shouldDisplayEmailNextToName } from '../helpers/email';
import { getInitials } from '../helpers/string';
import type { ActiveSessionLite } from './persistedSessionHelper';
import { getAccessTypeFromMask } from './sessionAccessType';

export const getSessionDisplayData = ({
    remote: { LocalID, DisplayName, Username, PrimaryEmail, AccessType },
}: ActiveSessionLite) => {
    const nameToDisplay = DisplayName || Username || PrimaryEmail || '';
    const initials = getInitials(nameToDisplay);

    const showEmail = shouldDisplayEmailNextToName(nameToDisplay, PrimaryEmail);
    const maybeEmailInBrackets = showEmail ? `<${PrimaryEmail}>` : '';

    const path = `/u/${LocalID}`;

    return {
        localID: LocalID,
        name: nameToDisplay,
        initials,
        email: PrimaryEmail,
        showEmail,
        maybeEmailInBrackets,
        path,
        accessType: getAccessTypeFromMask(AccessType),
    };
};
