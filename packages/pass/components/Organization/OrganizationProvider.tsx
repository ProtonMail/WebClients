import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isB2BAdmin } from '@proton/pass/lib/organization/helpers';
import { getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { selectOrganizationState, selectPassPlan, selectUser, selectUserPlan } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import type { OrganizationSettings } from '@proton/pass/types/data/organization';
import { PLANS } from '@proton/payments/index';
import type { Organization } from '@proton/shared/lib/interfaces';
import { isAdmin } from '@proton/shared/lib/user/helpers';

export type OrganizationContextValue = {
    organization: Organization;
    b2bAdmin: boolean;
    settings: OrganizationSettings & {
        enabled: boolean;
        sync: () => void;
    };
};

const OrganizationContext = createContext<MaybeNull<OrganizationContextValue>>(null);

/** Organization context will always be `null` for
 * users which do not belong to an organization. */
export const OrganizationProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();

    const passPlan = useSelector(selectPassPlan);
    const userPlan = useSelector(selectUserPlan);
    const user = useSelector(selectUser);
    const org = useSelector(selectOrganizationState);

    const isPassEssentialsAdmin = !!user && isAdmin(user) && userPlan?.InternalName === PLANS.PASS_PRO;
    const b2bAdmin = (user ? isB2BAdmin(user, passPlan) : false) || isPassEssentialsAdmin;

    const context = useMemo<MaybeNull<OrganizationContextValue>>(
        () =>
            org
                ? {
                      b2bAdmin,
                      organization: org.organization,
                      settings: {
                          ...org.settings,
                          enabled: org.canUpdate,
                          sync: () => dispatch(withRevalidate(getOrganizationSettings.intent())),
                      },
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
    const context = useContext(OrganizationContext);

    useEffect(() => {
        if (options?.sync) {
            context?.settings.sync();
        }
    }, [options?.sync]);

    return context;
};
