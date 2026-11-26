import { c } from 'ttag';

import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import SubSettingsSection from '@proton/components/containers/layout/SubSettingsSection';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { PassReportsUpgradeBanner } from '../PassUpgradeBanner';
import { PassMonitorReport } from './PassMonitorReport';
import { PassUsageReport } from './PassUsageReport';
import { usePassReports } from './usePassReports';

/** Both Pass reports on one page, as mounted in Account. Console mounts each report as its own page. */
export const PassReports = ({ upgradeRequired }: { upgradeRequired: boolean }) => {
    const state = usePassReports(upgradeRequired);

    return (
        <SettingsSectionWide customWidth="90em">
            {upgradeRequired && <PassReportsUpgradeBanner />}
            <SubSettingsSection
                id="monitor-report"
                title={c('Title').t`${PASS_SHORT_APP_NAME} Monitor Report`}
                className="container-section-sticky-section"
            >
                <PassMonitorReport state={state} upgradeRequired={upgradeRequired} />
            </SubSettingsSection>
            <SubSettingsSection
                id="usage-report"
                title={c('Title').t`Usage Report`}
                className="container-section-sticky-section"
            >
                <PassUsageReport state={state} upgradeRequired={upgradeRequired} />
            </SubSettingsSection>
        </SettingsSectionWide>
    );
};
