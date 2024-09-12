import { c } from 'ttag';

import { ButtonLike, Card } from '@proton/atoms';
import { DownloadClientCard, SettingsLink, SettingsParagraph, SettingsSectionWide } from '@proton/components';
import { usePlans, useUser } from '@proton/components/hooks';
import { PASS_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import { clients } from '@proton/shared/lib/pass/constants';
import clsx from '@proton/utils/clsx';

const UpgradeBanner = ({ className }: { className?: string }) => {
    const [user] = useUser();
    const [plansResult, loadingPlans] = usePlans();
    const passPlan = plansResult?.plans?.find(({ Name }) => Name === PLANS.PASS);

    const shouldUpgrade = user.isFree;

    if (loadingPlans || !shouldUpgrade || !passPlan) {
        return null;
    }

    const passPlusPlanName = passPlan.Title;

    return (
        <Card className={clsx('flex items-center gap-2', className)} rounded>
            <span className="flex-1">
                {
                    // translator: Variable here is a plan name
                    c('Upgrade').t`Upgrade to ${passPlusPlanName} to get unlimited hide-my-email aliases`
                }
            </span>

            <ButtonLike color="norm" as={SettingsLink} path={`/dashboard?plan=${PLANS.PASS}`}>
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
            <div className="flex gap-4 flex-column md:flex-row">
                {Object.values(clients).map(({ title, icon, link }) => {
                    if (!link) {
                        return null;
                    }

                    return <DownloadClientCard key={title} title={title} icon={icon} link={link} />;
                })}
            </div>
        </SettingsSectionWide>
    );
};

export default PassDownloadsSettingsPage;
