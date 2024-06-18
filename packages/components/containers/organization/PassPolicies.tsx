import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Info, Toggle } from '@proton/components/components';
import { useErrorHandler } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { usePassBridge } from '@proton/pass/lib/bridge/PassBridgeProvider';
import { BitField, OrganizationGetResponse } from '@proton/pass/types';
import { type OrganizationSettings } from '@proton/pass/types/data/organization';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { SettingsParagraph, SettingsSection } from '../account';

const INITIAL_STATE: OrganizationGetResponse = {
    CanUpdate: false,
    Settings: {
        ExportMode: 0,
        ForceLockSeconds: 0,
        ShareMode: 0,
    },
};

const getPolicies = (): {
    setting: keyof OrganizationSettings;
    label: string;
    tooltip: string;
}[] => [
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
    const {
        organization: { get, set },
    } = usePassBridge();
    const [organizationSettings, setOrganizationSettings] = useState<OrganizationGetResponse>(INITIAL_STATE);
    const [loading, withLoading] = useLoading();
    const handleError = useErrorHandler();

    const policies = getPolicies();

    useEffect(() => {
        const fetchOrganizationSettings = async () => {
            try {
                const settings = await get();
                setOrganizationSettings(settings);
            } catch (error) {
                handleError(error);
            }
        };
        withLoading(fetchOrganizationSettings()).catch(noop);
    }, []);

    const handleToggle = async (checked: boolean, setting: keyof OrganizationSettings) => {
        try {
            const value = checked ? BitField.ACTIVE : BitField.DISABLED;
            await withLoading(set(setting, value));
            setOrganizationSettings((prev) => {
                return partialMerge(prev, { Settings: { [setting]: value } });
            });
        } catch (error) {
            handleError(error);
        }
    };

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info').t`You can define the policies of ${PASS_APP_NAME} for the organization members.`}
            </SettingsParagraph>
            <ul className="unstyled relative">
                {policies.map(({ setting, label, tooltip }) => (
                    <li key={setting} className="mb-4 flex items-center flex-nowrap gap-4">
                        <Toggle
                            checked={organizationSettings?.Settings?.[setting] === BitField.ACTIVE}
                            id={`${setting}-toggle`}
                            onChange={({ target }) => handleToggle(target.checked, setting)}
                            disabled={loading || !organizationSettings.CanUpdate}
                            loading={loading}
                        />
                        <label htmlFor={`${setting}-toggle`}>
                            <span className="mr-1">{label}</span>
                            {tooltip && <Info title={tooltip} />}
                        </label>
                    </li>
                ))}
            </ul>
        </SettingsSection>
    );
};

export default PassPolicies;
