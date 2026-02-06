import { useMemo } from 'react';

import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import type { Maybe } from '@proton/pass/types';
import { toMap } from '@proton/shared/lib/helpers/object';

export type Options = Parameters<typeof useOrganization>[0];

export const useOrganizationGroups = (options?: Options): Record<string, Maybe<{ email: string; name: string }>> => {
    const organization = useOrganization(options);
    return useMemo(
        () =>
            toMap(
                organization?.groups?.map((group) => ({ email: group.Address.Email, name: group.Name })),
                'email'
            ),
        [organization?.groups]
    );
};
