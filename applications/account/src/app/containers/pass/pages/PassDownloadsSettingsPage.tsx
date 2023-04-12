import { c } from 'ttag';

import { DownloadClientCard } from '@proton/components/components';
import { SettingsParagraph, SettingsSectionWide } from '@proton/components/containers';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

const PassDownloadsSettingsPage = () => {
    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info')
                    .t`Access your passwords and protect your online identities seamlessly across your devices. Download and install the relevant ${PASS_APP_NAME} apps and extensions.`}
            </SettingsParagraph>
            <div className="flex gap-4 on-mobile-flex-column">
                <DownloadClientCard
                    title={c('VPNClient').t`Android`}
                    icon="brand-android"
                    link="https://play.google.com/store/apps/details?id=proton.android.pass"
                />
                <DownloadClientCard
                    title={c('VPNClient').t`iOS`}
                    icon="brand-apple"
                    link="https://apps.apple.com/us/app/id6443490629"
                />
                <DownloadClientCard
                    title={c('VPNClient').t`Chrome`}
                    icon="brand-chrome"
                    link="https://chrome.google.com/webstore/detail/proton-pass/ghmbeldphafepmbegfdlkpapadhbakde"
                />
                <DownloadClientCard
                    title={c('VPNClient').t`Brave`}
                    icon="brand-brave"
                    link="https://chrome.google.com/webstore/detail/proton-pass/ghmbeldphafepmbegfdlkpapadhbakde"
                />
            </div>
        </SettingsSectionWide>
    );
};

export default PassDownloadsSettingsPage;
