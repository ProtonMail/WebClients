import { type FC, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components';
import imgAlias from '@proton/pass/assets/monitor/img-alias.svg';
import imgDarkWeb from '@proton/pass/assets/monitor/img-dark-web.svg';
import imgNetShield from '@proton/pass/assets/monitor/img-net-shield.svg';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PillBadge } from '@proton/pass/components/Layout/Badge/PillBadge';
import { ButtonCard } from '@proton/pass/components/Layout/Card/ButtonCard';
import { CardContent } from '@proton/pass/components/Layout/Card/CardContent';
import { LearnMoreCard, type LearnMoreProps } from '@proton/pass/components/Layout/Card/LearnMoreCard';
import { SubHeader } from '@proton/pass/components/Layout/Section/SubHeader';
import { DarkWeb } from '@proton/pass/components/Monitor/Breach/DarkWeb';
import { Sentinel } from '@proton/pass/components/Monitor/Sentinel/Sentinel';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath, getNewItemRoute } from '@proton/pass/components/Navigation/routing';
import { UpsellingModal } from '@proton/pass/components/Upsell/UpsellingModal';
import { UpsellRef } from '@proton/pass/constants';
import { PASS_SHORT_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';

import { useMonitor } from './MonitorProvider';
import { getMonitorUpsellFeatures } from './utils';

import './Summary.scss';

export const Summary: FC = () => {
    const { onLink } = usePassCore();
    const { navigate } = useNavigation();
    const { breaches, duplicates, insecure, missing2FAs, excluded } = useMonitor();
    const [upsellModalOpen, setUpsellModalOpen] = useState(false);

    const learnMore: LearnMoreProps[] = useMemo(
        () => [
            {
                image: imgDarkWeb,
                title: c('Title').t`What is the dark web?`,
                description: c('Description')
                    .t`The dark web is a hidden part of the internet where stolen personal information, like identities, can be bought and sold.`,
                ctaLabel: c('Action').t`Learn more`,
                ctaAction: () => onLink('https://proton.me/blog/what-is-dark-web'),
            },
            {
                image: imgAlias,
                title: c('Title').t`What is an alias?`,
                description: c('Description')
                    .t`An email alias works like an email address, but reduces spam and keeps your actual email address and identity hidden.`,
                ctaLabel: c('Action').t`Create an alias`,
                ctaAction: () => navigate(getNewItemRoute('alias')),
            },
            {
                image: imgNetShield,
                title: c('Title').t`Block trackers and malware`,
                description: c('Description')
                    .t`NetShield is an ad-blocking feature from ${VPN_APP_NAME} that protects your device from ads, trackers, and malware. `,
                ctaLabel: c('Action').t`Enable NetShield`,
                ctaAction: () => onLink('https://protonvpn.com/support/netshield/'),
            },
        ],
        []
    );

    return (
        <div className="w-full h-full">
            <div className="flex flex-1 flex-column items-start w-full h-full">
                <Scroll className="flex-1 w-full">
                    <div className="flex flex-column gap-8 p-6 max-w-custom" style={{ '--max-w-custom': '74em' }}>
                        <SubHeader
                            title={c('Title').t`${PASS_SHORT_APP_NAME} monitor`}
                            description={c('Description')
                                .t`With ${PASS_SHORT_APP_NAME} Monitor, stay ahead of threats by getting instant alerts if your credentials are compromised. Unlock advanced security features and detailed logs to safeguard your online presence.`}
                        />

                        <section className="flex flex-column gap-6">
                            <h3 className="text-lg">{c('Title').t`Dark Web Monitoring`}</h3>
                            <div className="pass-monitor-grid gap-4">
                                <DarkWeb breached={breaches.count > 0} onUpsell={() => setUpsellModalOpen(true)} />
                            </div>
                        </section>

                        <section className="flex flex-column gap-6">
                            <h3 className="text-lg">{c('Title').t`Password Health`}</h3>
                            <div className="pass-monitor-grid gap-4">
                                <ButtonCard
                                    actions={<PillBadge label={insecure.count} />}
                                    disabled={insecure.count === 0}
                                    icon={duplicates.count > 0 ? 'exclamation-filled' : 'checkmark'}
                                    onClick={() => navigate(getLocalPath('monitor/weak'))}
                                    subtitle={c('Description').t`Change your passwords`}
                                    title={c('Title').t`Weak passwords`}
                                    type={insecure.count > 0 ? 'warning' : 'success'}
                                />
                                <ButtonCard
                                    actions={<PillBadge label={duplicates.count} />}
                                    disabled={duplicates.count === 0}
                                    icon={duplicates.count > 0 ? 'exclamation-filled' : 'checkmark'}
                                    onClick={() => navigate(getLocalPath('monitor/duplicates'))}
                                    subtitle={c('Description').t`Create unique passwords`}
                                    title={c('Title').t`Reused passwords`}
                                    type={duplicates.count > 0 ? 'warning' : 'success'}
                                />
                                <ButtonCard
                                    actions={<PillBadge label={missing2FAs.count} />}
                                    disabled={missing2FAs.count === 0}
                                    onClick={() => navigate(`${getLocalPath('monitor/2fa')}`)}
                                    subtitle={c('Description').t`Increase your security`}
                                    title={c('Title').t`Missing two-factor authentication`}
                                />
                                <ButtonCard
                                    actions={<PillBadge label={excluded.count} />}
                                    disabled={excluded.count === 0}
                                    onClick={() => navigate(getLocalPath('monitor/excluded'))}
                                    subtitle={c('Description').t`These items remain at risk`}
                                    title={c('Title').t`Excluded items`}
                                />
                            </div>
                        </section>

                        <section className="flex flex-column gap-6">
                            <h3 className="text-lg">{c('Title').t`Account protection`}</h3>
                            <Sentinel onUpsell={() => setUpsellModalOpen(true)} />
                        </section>

                        <section className="flex flex-column gap-6">
                            <Collapsible expandByDefault>
                                <CollapsibleHeader
                                    suffix={
                                        <CollapsibleHeaderIconButton>
                                            <Icon name="chevron-down" />
                                        </CollapsibleHeaderIconButton>
                                    }
                                >
                                    <h3 className="text-lg">{c('Title').t`Want to learn more?`}</h3>
                                    <span>{c('Description')
                                        .t`Keep your info more secure and private with these guides and tips.`}</span>
                                </CollapsibleHeader>
                                <CollapsibleContent>
                                    <div className="flex flex-row flex-nowrap w-full gap-4 items-stretch p-6">
                                        {learnMore.map((props, idx) => (
                                            <LearnMoreCard key={`learn-more-${idx}`} {...props} />
                                        ))}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </section>

                        <UpsellingModal
                            upsellRef={UpsellRef.PASS_MONITOR}
                            upsellType="pass-monitor"
                            open={upsellModalOpen}
                            onClose={() => setUpsellModalOpen(false)}
                            features={
                                <div className="border border-norm p-4 w-full rounded-xl">
                                    {getMonitorUpsellFeatures().map(({ label, icon }) => (
                                        <CardContent
                                            key={label}
                                            className="p-2 text-lg color-primary"
                                            icon={icon}
                                            title={label}
                                            ellipsis
                                        />
                                    ))}
                                </div>
                            }
                        />
                    </div>
                </Scroll>
            </div>
        </div>
    );
};
