import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isB2BAdmin, isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import {
    getOrganizationSettingsIntent,
    organizationSettingsEditIntent,
} from '@proton/pass/store/actions/creators/organizationSettings';
import { selectOrganizationSettings, selectPassPlan, selectUser } from '@proton/pass/store/selectors';
import { type OrganizationSettings, SettingMode } from '@proton/pass/types/data/organization';
import noop from '@proton/utils/noop';

type OrganizationContextValue = {
    isB2B: boolean;
    isB2BAdmin: boolean;
    isOrganizationOnly: (settingMode?: SettingMode) => boolean | undefined;
    toggleMode: (mode: keyof OrganizationSettings, newValue: boolean) => void;
};

const OrganizationContext = createContext<OrganizationContextValue>({
    isB2B: false,
    isB2BAdmin: false,
    isOrganizationOnly: noop,
    toggleMode: noop,
});

export const OrganizationProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();
    const passPlan = useSelector(selectPassPlan);
    const user = useSelector(selectUser);
    const b2bPlan = isBusinessPlan(passPlan);
    const b2bAdmin = user ? isB2BAdmin(user, passPlan) : false;
    const orgSettings = useSelector(selectOrganizationSettings);

    useEffect(() => {
        dispatch(getOrganizationSettingsIntent());
    }, [orgSettings]);

    const checkOrganizationSetting = useCallback((settingMode: SettingMode): boolean => {
        return settingMode === SettingMode.LIMITED;
    }, []);

    const shareMode = useCallback((restrictShare: boolean): SettingMode => {
        return restrictShare ? SettingMode.LIMITED : SettingMode.UNLIMITED;
    }, []);

    const toggleMode = useCallback((mode: keyof OrganizationSettings, newValue: boolean) => {
        let newSettings = orgSettings;
        if (newSettings) {
            newSettings[mode] = shareMode(newValue);
            dispatch(organizationSettingsEditIntent({ organizationSettings: newSettings }));
        }
    }, []);

    const context = useMemo<OrganizationContextValue>(() => {
        return {
            isB2B: b2bPlan,
            isB2BAdmin: b2bAdmin,
            isOrganizationOnly: (organizationSetting?: SettingMode) =>
                checkOrganizationSetting(organizationSetting || SettingMode.UNLIMITED),
            toggleMode: (mode: keyof OrganizationSettings, newShareMode: boolean) => {
                toggleMode(mode, newShareMode);
            },
        };
    }, [b2bAdmin, user, passPlan, orgSettings]);

    return <OrganizationContext.Provider value={context}>{children}</OrganizationContext.Provider>;
};

export const useOrganization = () => useContext(OrganizationContext);
