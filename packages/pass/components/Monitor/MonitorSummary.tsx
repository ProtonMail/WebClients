import { type FC, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll';
import { PillBadge } from '@proton/pass/components/Layout/Badge/PillBadge';
import { ButtonCard } from '@proton/pass/components/Layout/Card/ButtonCard';
import { CardContent } from '@proton/pass/components/Layout/Card/CardContent';
import { SubHeader } from '@proton/pass/components/Layout/Section/SubHeader';
import { BreachSummaryCard } from '@proton/pass/components/Monitor/Breach/Card/BreachSummaryCard';
import { BreachUpsellCard } from '@proton/pass/components/Monitor/Breach/Card/BreachUpsellCard';
import { Sentinel } from '@proton/pass/components/Monitor/Sentinel/Sentinel';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { UpsellingModal } from '@proton/pass/components/Upsell/UpsellingModal';
import { UpsellRef } from '@proton/pass/constants';
import { useUpsellPlanFeatures } from '@proton/pass/hooks/usePlanFeatures';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { selectMonitorPreview } from '@proton/pass/store/selectors';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { BreachPreviewCard } from './Breach/Card/BreachPreviewCard';
import { useMonitor } from './MonitorContext';
import { MonitorLearnMore } from './MonitorLearnMore';

import './MonitorSummary.scss';

export const MonitorSummary: FC = () => {
    const { navigate } = useNavigation();
    const { duplicates, insecure, missing2FAs, excluded } = useMonitor();
    const { plan, features, upsellType, upgradePath } = useUpsellPlanFeatures();

    const paid = isPaidPlan(plan);
    const preview = useSelector(selectMonitorPreview);
    const [upsellModalOpen, setUpsellModalOpen] = useState(false);
    const onUpsell = () => setUpsellModalOpen(true);

    useTelemetryEvent(TelemetryEventName.PassMonitorDisplayHome, {}, {})([]);

    return (
        <div className="w-full h-full">
            <div className="flex flex-1 flex-column items-start w-full h-full">
                <Scroll className="flex-1 w-full">
                    <div className="flex flex-column gap-8 p-6 max-w-custom" style={{ '--max-w-custom': '80em' }}>
                        <SubHeader
                            title={c('Title').t`${PASS_SHORT_APP_NAME} Monitor`}
                            description={c('Description')
                                .t`With ${PASS_SHORT_APP_NAME} Monitor, stay ahead of threats by getting instant alerts if your credentials are compromised. Unlock advanced security features and detailed logs to safeguard your online presence.`}
                        />

                        <section className="flex flex-column gap-4">
                            <h3 className="text-lg text-semibold">{c('Title').t`Dark Web Monitoring`}</h3>
                            <div className="pass-monitor-grid gap-4">
                                {paid && (
                                    <BreachSummaryCard
                                        className="xl:self-start"
                                        onClick={() => navigate(getLocalPath('monitor/dark-web'))}
                                    />
                                )}

                                {!paid &&
                                    (preview ? (
                                        <BreachPreviewCard
                                            className="xl:self-start"
                                            preview={preview}
                                            onUpsell={onUpsell}
                                        />
                                    ) : (
                                        <BreachUpsellCard className="xl:self-start" onUpsell={onUpsell} />
                                    ))}
                            </div>
                        </section>

                        <section className="flex flex-column gap-4">
                            <h3 className="text-lg text-semibold">{c('Title').t`Password Health`}</h3>
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
                                    subtitle={c('Description').t`Set up 2FA for more security`}
                                    title={c('Title').t`Inactive 2FA`}
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

                        <section className="flex flex-column gap-4">
                            <h3 className="text-lg text-semibold">{c('Title').t`Account protection`}</h3>
                            <Sentinel onUpsell={() => setUpsellModalOpen(true)} />
                        </section>

                        <section className="flex flex-column gap-6">
                            <MonitorLearnMore />
                        </section>

                        <UpsellingModal
                            upsellRef={UpsellRef.PASS_MONITOR}
                            upsellType={upsellType}
                            upgradePath={upgradePath}
                            open={upsellModalOpen}
                            onClose={() => setUpsellModalOpen(false)}
                            features={
                                <div className="border border-norm p-4 w-full rounded-xl">
                                    {features.map(({ label, icon }) => (
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
