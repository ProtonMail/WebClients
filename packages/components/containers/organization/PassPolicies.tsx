import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import { PassLockSelector } from '@proton/components/containers/pass/PassLockSelector';
import { useErrorHandler } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { usePassBridge } from '@proton/pass/lib/bridge/PassBridgeProvider';
import type { OrganizationGetResponse } from '@proton/pass/types';
import { BitField, type Maybe } from '@proton/pass/types';
import type { OrganizationSettings } from '@proton/pass/types/data/organization';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash';

import GenericError from '../error/GenericError';

const getPolicies = (): { setting: keyof OrganizationSettings; label: string; tooltip: string }[] => [
    {
        setting: 'ShareMode',
        label: c('Label').t`Disable sharing outside the organization`,
        tooltip: c('Info')
            .t`If this option is turned on, organization members will only be able to share vaults within the organization`,
    },
    {
        setting: 'ExportMode',
        label: c('Label').t`Disable data export for organization members`,
        tooltip: c('Info')
            .t`By default, organization members can only export vaults where they are the owners. If this option is turned on, they won't be able to export any data`,
    },
];

const PassPolicies = () => {
    const { organization } = usePassBridge();
    const [loading, withLoading] = useLoading(true);
    const handleError = useErrorHandler();

    const policies = getPolicies();
    const showForceLock = useFlag('PassB2BForceLock');
    const [organizationSettings, setOrganizationSettings] = useState<Maybe<OrganizationGetResponse>>();

    const touched = useRef<keyof OrganizationSettings>();
    const didLoad = useRef(false);

    useEffect(() => {
        const fetchOrganizationSettings = () =>
            organization.settings.get().then((settings) => {
                setOrganizationSettings(settings);
                didLoad.current = true;
            });

        withLoading(fetchOrganizationSettings()).catch(handleError);
    }, []);

    const handleToggle = async (checked: boolean, setting: keyof OrganizationSettings) => {
        touched.current = setting;
        const value = checked ? BitField.ACTIVE : BitField.DISABLED;
        withLoading(organization.settings.set(setting, value).then(setOrganizationSettings)).catch(handleError);
    };

    const handleLockChange = async (ttl: number) => {
        touched.current = 'ForceLockSeconds';
        withLoading(organization.settings.set('ForceLockSeconds', ttl).then(setOrganizationSettings)).catch(
            handleError
        );
    };

    return (
        <>
            <SettingsSection>
                <SettingsParagraph>
                    {c('Info').t`You can define the policies of ${PASS_APP_NAME} for the organization members.`}
                </SettingsParagraph>
                {organizationSettings && (
                    <>
                        <ul className="unstyled relative">
                            {policies.map(({ setting, label, tooltip }) => (
                                <li key={setting} className="mb-4 flex items-center flex-nowrap gap-4">
                                    <Toggle
                                        checked={organizationSettings.Settings?.[setting] === BitField.ACTIVE}
                                        id={`${setting}-toggle`}
                                        onChange={({ target }) => handleToggle(target.checked, setting)}
                                        disabled={loading || !organizationSettings.CanUpdate}
                                        loading={touched.current === setting && loading}
                                    />
                                    <label htmlFor={`${setting}-toggle`}>
                                        <span className="mr-1">{label}</span>
                                        {tooltip && <Info title={tooltip} />}
                                    </label>
                                </li>
                            ))}
                        </ul>
                        {showForceLock && (
                            <SettingsLayout>
                                <SettingsLayoutLeft>
                                    <label
                                        className="text-semibold"
                                        htmlFor="pass-lock-select"
                                        id="label-pass-lock-select"
                                    >
                                        <span className="mr-1"> {c('Label').t`Lock app after inactivity`}</span>
                                        <Info
                                            title={c('Info')
                                                .t`After being locked, organization members will need to unlock ${PASS_APP_NAME} with their password or PIN etc.`}
                                        />
                                    </label>
                                </SettingsLayoutLeft>
                                <SettingsLayoutRight>
                                    <PassLockSelector
                                        value={organizationSettings?.Settings?.ForceLockSeconds}
                                        disabled={loading || !organizationSettings.CanUpdate}
                                        onChange={handleLockChange}
                                    />
                                </SettingsLayoutRight>
                            </SettingsLayout>
                        )}
                    </>
                )}
            </SettingsSection>

            {!didLoad.current && loading && <CircleLoader />}
            {!loading && !organizationSettings && <GenericError className="mt-16" />}
        </>
    );
};

export default PassPolicies;
