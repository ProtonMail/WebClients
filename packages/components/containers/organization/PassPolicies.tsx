import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Info, Toggle } from '@proton/components/components';
import { useErrorHandler } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { usePassBridge } from '@proton/pass/lib/bridge/PassBridgeProvider';
import { BitField, OrganizationGetResponse } from '@proton/pass/types';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import {
    SettingsLayout,
    SettingsLayoutLeft,
    SettingsLayoutRight,
    SettingsParagraph,
    SettingsSection,
} from '../account';

const INITIAL_STATE: OrganizationGetResponse = {
    CanUpdate: false,
    Settings: {
        ExportMode: 0,
        ForceLockSeconds: 0,
        ShareMode: 0,
    },
};

const PassPolicies = () => {
    const {
        organization: { get, set },
    } = usePassBridge();
    const [organizationSettings, setOrganizationSettings] = useState<OrganizationGetResponse>(INITIAL_STATE);
    const [loading, withLoading] = useLoading();
    const handleError = useErrorHandler();

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

    const handleSharingToggle = async (checked: boolean) => {
        try {
            const value = checked ? BitField.ACTIVE : BitField.DISABLED;
            await withLoading(set('ShareMode', value));
            setOrganizationSettings((prev) => {
                return partialMerge(prev, { Settings: { ShareMode: value } });
            });
        } catch (error) {
            handleError(error);
        }
    };

    const handleExportToggle = async (checked: boolean) => {
        try {
            const value = checked ? BitField.ACTIVE : BitField.DISABLED;
            await withLoading(set('ExportMode', value));
            setOrganizationSettings((prev) => {
                return partialMerge(prev, { Settings: { ExportMode: value } });
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
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="sharing-toggle" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Disable sharing outside the organization.`}</span>
                        <Info
                            title={c('Info')
                                .t`If this option is turned on, organization members will only be able to share vaults within the organization`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Toggle
                        checked={organizationSettings?.Settings?.ShareMode === BitField.ACTIVE}
                        id="sharing-toggle"
                        onChange={({ target }) => handleSharingToggle(target.checked)}
                        disabled={loading || !organizationSettings.CanUpdate}
                        loading={loading}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="export-toggle" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Disable data export for organization members`}</span>
                        <Info
                            title={c('Info')
                                .t`By default, organization members can only export vaults where they are the owners. If this option is turned on, they won't be able to export any data`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Toggle
                        checked={organizationSettings?.Settings?.ExportMode === BitField.ACTIVE}
                        id="export-toggle"
                        onChange={({ target }) => handleExportToggle(target.checked)}
                        disabled={loading || !organizationSettings.CanUpdate}
                        loading={loading}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};

export default PassPolicies;
