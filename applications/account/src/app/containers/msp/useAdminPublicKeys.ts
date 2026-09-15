import { useMemo } from 'react';

import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import type { Member } from '@proton/shared/lib/interfaces';

// Org admins implicitly have access to every subsidiary, so consumers that display delegated
// managers exclude admins to avoid a redundant entry (they can end up as an explicit delegated
// manager as a side effect of forking into the subsidiary via the "Manage" button).
export const useAdminPublicKeys = (members: Member[]) =>
    useMemo(
        () =>
            new Set(
                members
                    .filter((member) => member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN && !!member.PublicKey)
                    .map((member) => member.PublicKey)
            ),
        [members]
    );
