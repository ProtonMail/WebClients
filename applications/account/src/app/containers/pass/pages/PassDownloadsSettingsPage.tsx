import { c } from 'ttag';

import { ButtonLike, Card } from '@proton/atoms';
import { DownloadClientCard, SettingsLink } from '@proton/components/components';
import { FeatureCode, SettingsParagraph, SettingsSectionWide } from '@proton/components/containers';
import { useFeature, usePlans, useUser } from '@proton/components/hooks';
import { PASS_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

const UpgradeBanner = ({ className }: { className?: string }) => {
    const [user] = useUser();
    const [plans, loadingPlans] = usePlans();
    const passPlan = plans?.find(({ Name }) => Name === PLANS.PASS_PLUS);

    const passPlusPlanFeature = useFeature<boolean>(FeatureCode.PassPlusPlan);
    const isPassPlusEnabled = passPlusPlanFeature.feature?.Value === true;

    const shouldUpgrade = user.isFree;

    if (loadingPlans || !shouldUpgrade || !passPlan || !isPassPlusEnabled) {
        return null;
    }

    const passPlusPlanName = passPlan.Title;

    return (
        <Card className={clsx('flex flex-align-items-center gap-2', className)} rounded>
            <span className="flex-item-fluid">
                {
                    // translator: Variable here is a plan name
                    c('Upgrade').t`Upgrade to ${passPlusPlanName} to get unlimited Hide My Email aliases`
                }
            </span>

            <ButtonLike color="norm" as={SettingsLink} path={`/dashboard?plan=${PLANS.PASS_PLUS}`}>
                {c('Action').t`Upgrade`}
            </ButtonLike>
        </Card>
    );
};

const PassDownloadsSettingsPage = () => {
    return (
        <SettingsSectionWide>
            <UpgradeBanner className="mb-6" />
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
                <DownloadClientCard
                    title={c('VPNClient').t`Firefox`}
                    icon="brand-firefox"
                    link="https://addons.mozilla.org/en-US/firefox/addon/proton-pass/"
                />
            </div>
        </SettingsSectionWide>
    );
};

export default PassDownloadsSettingsPage;
