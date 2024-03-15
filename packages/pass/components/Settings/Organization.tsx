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
    const { settings, updateSetting } = useOrganization()!;
    const shareMode = settings.ShareMode;
    const loading = useSelector(selectRequestInFlight(organizationSettingsEditRequest())) !== null;

    return (
        <>
            {enableOrganizationSharing && (
                <SettingsPanel title={c('Label').t`Sharing policy`}>
                    <Checkbox
                        disabled={loading}
                        checked={shareMode === BitField.ACTIVE}
                        onChange={() => updateSetting('ShareMode', Number(!Boolean(shareMode)))}
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
        </>
    );
};
