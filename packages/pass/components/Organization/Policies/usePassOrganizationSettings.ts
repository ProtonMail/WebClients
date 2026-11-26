import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';

import { usePassBridge } from '../../../lib/bridge/PassBridgeProvider';
import type { OrganizationGetResponse, OrganizationUpdatePasswordPolicyInput } from '../../../types/api/pass';
import type { OrganizationSettings } from '../../../types/data/organization';
import type { Maybe } from '../../../types/utils';

export const usePassOrganizationSettings = (upgradeRequired: boolean) => {
    const { organization } = usePassBridge();
    const [loading, withLoading] = useLoading(!upgradeRequired);
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();
    const [organizationSettings, setOrganizationSettings] = useState<Maybe<OrganizationGetResponse>>();

    const touched = useRef<keyof OrganizationSettings>(undefined);
    const didLoad = useRef(false);

    useEffect(() => {
        // Plans without the policies feature (e.g. Pass Essentials) can't read the org
        // policy settings, so don't even attempt the fetch — the page is an upsell preview.
        if (upgradeRequired) {
            return;
        }

        const fetchOrganizationSettings = () =>
            organization.settings.get().then((settings) => {
                setOrganizationSettings(settings);
                didLoad.current = true;
            });

        withLoading(fetchOrganizationSettings()).catch(handleError);
    }, []);

    const setSetting = <K extends keyof OrganizationSettings>(setting: K, value: OrganizationSettings[K]) => {
        touched.current = setting;
        withLoading(
            organization.settings.set(setting, value).then((orgSettings) => {
                setOrganizationSettings(orgSettings);
                createNotification({ text: c('Info').t`Setting successfully saved` });
            })
        ).catch(handleError);
    };

    const setPasswordGeneratorPolicy = async (config: OrganizationUpdatePasswordPolicyInput) => {
        withLoading(
            organization.settings.setPasswordGeneratorPolicy(config).then((orgSettings) => {
                setOrganizationSettings(orgSettings);
                createNotification({ text: c('Info').t`Password generator rules successfully saved` });
            })
        ).catch(handleError);
    };

    return {
        organizationSettings,
        loading,
        /** The setting being saved, to show its spinner. Kept on the last one until another is saved. */
        touchedSetting: touched.current,
        showLoader: !didLoad.current && loading,
        showError: !loading && !organizationSettings && !upgradeRequired,
        setSetting,
        setPasswordGeneratorPolicy,
    };
};
