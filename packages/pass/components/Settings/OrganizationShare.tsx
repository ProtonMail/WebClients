import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Checkbox } from '@proton/components/index';
import { useOrganization } from '@proton/pass/components/Settings/Organization/OrganizationProvider';
import { selectOrganizationShareMode } from '@proton/pass/store/selectors';
import { SettingMode } from '@proton/pass/types/data/organization';

import { SettingsPanel } from './SettingsPanel';

export const OrganizationShare: FC = () => {
    const { toggleMode, isOrganizationOnly } = useOrganization();
    const shareOrganizationOnly = isOrganizationOnly(useSelector(selectOrganizationShareMode) || SettingMode.UNLIMITED);

    return (
        <SettingsPanel title={c('Label').t`Sharing policy`}>
            <Checkbox
                checked={shareOrganizationOnly}
                onChange={() => {
                    toggleMode('shareMode', !shareOrganizationOnly);
                }}
            >
                <span>
                    {c('Label').t`Not allow sharing outside the organization`}
                    <span className="block color-weak text-sm">
                        {c('Info').t`Team members can only share vaults within organization`}
                    </span>
                </span>
            </Checkbox>
        </SettingsPanel>
    );
};
