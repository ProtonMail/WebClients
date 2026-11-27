import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { Organization } from '@proton/shared/lib/interfaces/Organization';
import { isAdmin } from '@proton/shared/lib/user/helpers';

import { isPassB2BPlan } from '../../lib/b2b/b2b.utils';
import { getOrganizationSettings } from '../../store/actions/creators/organization';
import { withRevalidate } from '../../store/request/enhancers';
import { selectOrganizationState } from '../../store/selectors/organization';
import { selectUser, selectUserPlan } from '../../store/selectors/user';
import type { OrganizationSettings } from '../../types/data/organization';
import type { MaybeNull } from '../../types/utils';

type OrganizationContextValue = {
    organization: Organization;
    b2bAdmin: boolean;
    settings: OrganizationSettings & { enabled: boolean };
};

const OrganizationContext = createContext<MaybeNull<OrganizationContextValue>>(null);

/** Organization context will always be `null` for
 * users which do not belong to an organization. */
export const OrganizationProvider: FC<PropsWithChildren> = ({ children }) => {
    const userPlan = useSelector(selectUserPlan);
    const user = useSelector(selectUser);
    const org = useSelector(selectOrganizationState);

    const b2bAdmin = !!user && isAdmin(user) && !!userPlan && isPassB2BPlan(userPlan);

    const context = useMemo<MaybeNull<OrganizationContextValue>>(
        () =>
            org
                ? {
                      b2bAdmin,
                      organization: org.organization,
                      settings: { ...org.settings, enabled: org.canUpdate },
                  }
                : null,
        [b2bAdmin, org]
    );

    return <OrganizationContext.Provider value={context}>{children}</OrganizationContext.Provider>;
};

type Props = {
    /** Fetch organization settings on component first mount */
    sync: boolean;
};

export const useOrganization = (options?: Props) => {
    const dispatch = useDispatch();
    const context = useContext(OrganizationContext);

    useEffect(() => {
        if (options?.sync) {
            dispatch(withRevalidate(getOrganizationSettings.intent()));
        }
    }, [options?.sync]);

    return context;
};
