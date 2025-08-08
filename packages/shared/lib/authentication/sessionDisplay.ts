import { getInitials } from '@proton/shared/lib/helpers/string';

import type { ActiveSessionLite } from './persistedSessionHelper';

export const getSessionDisplayData = ({
    remote: { LocalID, DisplayName, Username, PrimaryEmail },
    persisted: { accessType },
}: ActiveSessionLite) => {
    const nameToDisplay = DisplayName || Username || PrimaryEmail || '';
    const initials = getInitials(nameToDisplay);

    const maybeEmailInBrackets = PrimaryEmail ? `<${PrimaryEmail}>` : '';

    const path = `/u/${LocalID}`;

    return {
        localID: LocalID,
        name: nameToDisplay,
        initials,
        email: PrimaryEmail,
        maybeEmailInBrackets,
        path,
        accessType,
    };
};
