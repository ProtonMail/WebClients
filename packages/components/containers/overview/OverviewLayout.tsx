import { ReactNode, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { hasMailPlus } from '@proton/shared/lib/helpers/subscription';

import { SettingsLink } from '../../components';
import { useOrganization, useSubscription, useUser, useUserSettings } from '../../hooks';
import { SettingsPageTitle } from '../account';
import { SectionConfig } from '../layout';
import IndexSection from './IndexSection';
import SummarySection from './SummarySection';

interface Props {
    title: string;
    pages: SectionConfig[];
    children?: ReactNode;
    limit?: number;
}

const OverviewLayout = ({ title, pages, children, limit }: Props) => {
    const mainAreaRef = useRef<HTMLDivElement>(null);

    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const [organization] = useOrganization();
    const [subscription] = useSubscription();
    const { hasPaidMail } = user;

    useEffect(() => {
        if (mainAreaRef.current) {
            mainAreaRef.current.scrollTop = 0;
        }
    }, []);

    return (
        <div className="flex flex-item-fluid on-desktop-h100 auto-tablet flex-nowrap">
            <div
                ref={mainAreaRef}
                className="relative flex-nowrap flex-item-fluid bg-weak on-desktop-h100 scroll-if-needed"
            >
                <SettingsPageTitle>{title}</SettingsPageTitle>
                <div className="container-section-sticky pt0">
                    <div className="flex on-mobile-flex-column pb2">
                        <div className="flex-item-fluid">
                            {children ? (
                                <section className="overview-grid-item overview-grid-item--full border bg-norm shadow-norm p2 mb1-5">
                                    {children}
                                </section>
                            ) : null}
                            <IndexSection pages={pages} limit={limit} />
                        </div>
                    </div>
                </div>
            </div>
            <aside className="context-bar on-desktop-h100 scroll-if-needed p2">
                <SummarySection
                    user={user}
                    userSettings={userSettings}
                    subscription={subscription}
                    organization={organization}
                />
                {subscription && hasMailPlus(subscription) ? (
                    <div className="bg-primary rounded text-center p1 mt2 relative">
                        <p className="mt-0 mb1">
                            {c('Info')
                                .t`Upgrade to a paid plan with multi-user support to add more users to your organization.`}
                        </p>
                        <div>
                            <ButtonLike
                                as={SettingsLink}
                                className="increase-click-surface color-inherit"
                                color="weak"
                                shape="outline"
                                path="/upgrade"
                            >
                                {c('Action').t`Upgrade`}
                            </ButtonLike>
                        </div>
                    </div>
                ) : null}
                {hasPaidMail ? null : (
                    <div className="bg-primary rounded text-center p1 mt2 relative">
                        <p className="mt-0 mb1">
                            {c('Info')
                                .t`Upgrade to a paid plan to unlock premium features and increase your storage space.`}
                        </p>
                        <div>
                            <ButtonLike
                                as={SettingsLink}
                                className="increase-click-surface color-inherit"
                                color="weak"
                                shape="outline"
                                path="/upgrade"
                            >
                                {c('Action').t`Upgrade`}
                            </ButtonLike>
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
};

export default OverviewLayout;
