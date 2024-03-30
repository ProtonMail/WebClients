import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isB2BAdmin } from '@proton/pass/lib/organization/helpers';
import {
    getOrganizationSettingsIntent,
    organizationSettingsEditIntent,
} from '@proton/pass/store/actions/creators/organization';
import { withRevalidate } from '@proton/pass/store/actions/enhancers/request';
import type { OrganizationState } from '@proton/pass/store/reducers/organization';
import { selectOrganizationState, selectPassPlan, selectUser } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import type { OrganizationSettings } from '@proton/pass/types/data/organization';

export type OrganizationContextValue = OrganizationState & {
    b2bAdmin: boolean;
    syncSettings: () => void;
    updateSetting: <K extends keyof OrganizationSettings>(setting: K, value: OrganizationSettings[K]) => void;
};

const OrganizationContext = createContext<MaybeNull<OrganizationContextValue>>(null);

/** Organization context will always be `null` for
 * users which do not belong to an organization. */
export const OrganizationProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();

    const passPlan = useSelector(selectPassPlan);
    const user = useSelector(selectUser);
    const organization = useSelector(selectOrganizationState);
    const b2bAdmin = user ? isB2BAdmin(user, passPlan) : false;

    const context = useMemo<MaybeNull<OrganizationContextValue>>(
        () =>
            organization
                ? {
                      b2bAdmin,
                      syncSettings: () => dispatch(withRevalidate(getOrganizationSettingsIntent())),
                      updateSetting: (key, value) => dispatch(organizationSettingsEditIntent({ [key]: value })),
                      ...organization,
                  }
                : null,
        [b2bAdmin, organization]
    );

    return <OrganizationContext.Provider value={context}>{children}</OrganizationContext.Provider>;
};

export const useOrganization = () => useContext(OrganizationContext);
