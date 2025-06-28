import { Fragment } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import { ButtonLike, Card } from '@proton/atoms';
import { DownloadClientCard, SettingsLink, SettingsParagraph, SettingsSectionWide } from '@proton/components';
import { PLANS } from '@proton/payments';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { Clients, clients } from '@proton/shared/lib/pass/constants';
import { hasPassLifetime } from '@proton/shared/lib/user/helpers';
import clsx from '@proton/utils/clsx';

type Section = { header: string; platforms: Clients[] };

const UpgradeBanner = ({ className }: { className?: string }) => {
    const [user] = useUser();
    const [plansResult, loadingPlans] = usePlans();
    const passPlan = plansResult?.plans?.find(({ Name }) => Name === PLANS.PASS);

    const shouldUpgrade = user.isFree;

    if (loadingPlans || !shouldUpgrade || !passPlan || hasPassLifetime(user)) {
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
    const sections: Section[] = [
        {
            header: c('Title').t`Browser extensions`,
            platforms: [Clients.Chrome, Clients.Firefox, Clients.Brave, Clients.Edge, Clients.Safari],
        },
        { header: c('Title').t`Mobile`, platforms: [Clients.Android, Clients.iOS] },
        { header: c('Title').t`Desktop`, platforms: [Clients.Windows, Clients.macOS, Clients.Linux] },
    ];

    return (
        <SettingsSectionWide customWidth="90em">
            <UpgradeBanner className="mb-6" />
            <SettingsParagraph>
                {c('Info')
                    .t`Access your passwords and protect your online identities seamlessly across your devices. Download and install the relevant ${PASS_APP_NAME} apps and extensions.`}
            </SettingsParagraph>
            {sections.map(({ header, platforms }) => (
                <Fragment key={header}>
                    <h4 className="text-bold mb-4">{header}</h4>
                    <div className="flex gap-4 flex-column md:flex-row mb-4">
                        {platforms.map((platform) => {
                            const { title, icon, link } = clients[platform];
                            if (!link) {
                                return null;
                            }

                            return <DownloadClientCard key={title} title={title} icon={icon} link={link} />;
                        })}
                    </div>
                </Fragment>
            ))}
        </SettingsSectionWide>
    );
};

export default PassDownloadsSettingsPage;
