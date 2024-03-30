import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { isB2BAdmin } from '@proton/pass/lib/organization/helpers';
import {
    getOrganizationSettingsIntent,
    organizationSettingsEditIntent,
} from '@proton/pass/store/actions/creators/organization';
import { withRevalidate } from '@proton/pass/store/actions/enhancers/request';
import { selectOrganizationState, selectPassPlan, selectUser } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import type { OrganizationSettings } from '@proton/pass/types/data/organization';
import type { Organization } from '@proton/shared/lib/interfaces';

export type OrganizationContextValue = {
    organization: Organization;
    b2bAdmin: boolean;
    settings: OrganizationSettings & {
        enabled: boolean;
        sync: () => void;
        update: <K extends keyof OrganizationSettings>(setting: K, value: OrganizationSettings[K]) => void;
    };
};

const OrganizationContext = createContext<MaybeNull<OrganizationContextValue>>(null);

/** Organization context will always be `null` for
 * users which do not belong to an organization. */
export const OrganizationProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();

    const passPlan = useSelector(selectPassPlan);
    const user = useSelector(selectUser);
    const org = useSelector(selectOrganizationState);
    const b2bAdmin = user ? isB2BAdmin(user, passPlan) : false;

    const enableOrganizationSharing = useFeatureFlag(PassFeature.PassEnableOrganizationSharing);
    const enableOrganizationExport = useFeatureFlag(PassFeature.PassEnableOrganizationExport);
    const enabled = enableOrganizationSharing || enableOrganizationExport;

    const context = useMemo<MaybeNull<OrganizationContextValue>>(
        () =>
            org
                ? {
                      b2bAdmin,
                      organization: org.organization,
                      settings: {
                          ...org.settings,
                          enabled: org.canUpdate && enabled,
                          sync: () => dispatch(withRevalidate(getOrganizationSettingsIntent())),
                          update: (key, value) => dispatch(organizationSettingsEditIntent({ [key]: value })),
                      },
                  }
                : null,
        [b2bAdmin, org, enabled]
    );

    return <OrganizationContext.Provider value={context}>{children}</OrganizationContext.Provider>;
};

export const useOrganization = () => useContext(OrganizationContext);
