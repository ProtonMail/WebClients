import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Checkbox } from '@proton/components/index';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { organizationSettingsEditRequest } from '@proton/pass/store/actions/requests';
import { selectRequestInFlight } from '@proton/pass/store/selectors';
import { BitField } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';

import { SettingsPanel } from './SettingsPanel';

export const Organization: FC = () => {
    const enableOrganizationSharing = useFeatureFlag(PassFeature.PassEnableOrganizationSharing);
    const enableOrganizationExport = useFeatureFlag(PassFeature.PassEnableOrganizationExport);

    const { settings } = useOrganization()!;
    const { ShareMode, ExportMode } = settings;
    const loading = useSelector(selectRequestInFlight(organizationSettingsEditRequest()));

    return (
        <>
            {enableOrganizationSharing && (
                <SettingsPanel title={c('Label').t`Sharing policy`}>
                    <Checkbox
                        disabled={loading}
                        checked={ShareMode === BitField.ACTIVE}
                        onChange={() => settings.update('ShareMode', Number(!Boolean(ShareMode)))}
                    >
                        <span>
                            {c('Label').t`Disable sharing outside the organization`}
                            <span className="block color-weak text-sm">
                                {c('Info').t`Team members can only share vaults within organization`}
                            </span>
                        </span>
                    </Checkbox>
                </SettingsPanel>
            )}

            {enableOrganizationExport && (
                <SettingsPanel title={c('Label').t`Exporting policy`}>
                    <Checkbox
                        disabled={loading}
                        checked={ExportMode === BitField.ACTIVE}
                        onChange={() => settings.update('ExportMode', Number(!Boolean(ExportMode)))}
                    >
                        <span>
                            {c('Label').t`Disable data export for team members`}
                            <span className="block color-weak text-sm">
                                {c('Info')
                                    .t`By default team members can only export vaults where they are the owners. If this option is turned on, they won't be able to export any data`}
                            </span>
                        </span>
                    </Checkbox>
                </SettingsPanel>
            )}
        </>
    );
};
