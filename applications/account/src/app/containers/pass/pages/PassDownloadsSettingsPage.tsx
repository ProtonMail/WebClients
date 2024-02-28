import { c } from 'ttag';

import { ButtonLike, Card } from '@proton/atoms';
import { DownloadClientCard, SettingsLink } from '@proton/components/components';
import { SettingsParagraph, SettingsSectionWide, useFlag } from '@proton/components/containers';
import { usePlans, useUser } from '@proton/components/hooks';
import { PASS_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import { getDownloadablePassClients } from '@proton/shared/lib/pass/constants';
import clsx from '@proton/utils/clsx';

const UpgradeBanner = ({ className }: { className?: string }) => {
    const [user] = useUser();
    const [plansResult, loadingPlans] = usePlans();
    const passPlan = plansResult?.plans?.find(({ Name }) => Name === PLANS.PASS_PLUS);

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

            <ButtonLike color="norm" as={SettingsLink} path={`/dashboard?plan=${PLANS.PASS_PLUS}`}>
                {c('Action').t`Upgrade`}
            </ButtonLike>
        </Card>
    );
};

const PassDownloadsSettingsPage = () => {
    const passWindowsDownloadEnabled = useFlag('PassWindowsDownload');

    const clients = getDownloadablePassClients({ includeWindows: passWindowsDownloadEnabled });

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
