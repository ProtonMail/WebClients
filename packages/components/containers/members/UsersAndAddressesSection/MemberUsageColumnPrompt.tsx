import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useApi from '@proton/components/hooks/useApi';
import type { MemberUsageColumnState } from '@proton/shared/lib/api/members';
import { Audience } from '@proton/shared/lib/interfaces';
import monitorGatewaysIllustration from '@proton/styles/assets/img/vpn/users/monitor-gateways-illustration.png';

import TogglingMonitoringModal from '../../b2bDashboard/VPN/TogglingMonitoringModal';
import { updateMonitoringSetting } from '../../b2bDashboard/VPN/api';
import { useSubscriptionModal } from '../../payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../payments/subscription/constants';
import GatewayMonitorUpsellModal from './GatewayMonitorUpsellModal';
import useUserActivityTelemetry from './useUserActivityTelemetry';

const wrapperClassName = 'flex flex-column items-center text-center gap-2 color-weak mx-auto p-6 max-w-custom';

const UpsellPrompt = () => {
    const {
        trackConnectionUpsellShown,
        trackConnectionUpsellLearnMoreClicked,
        trackConnectionUpsellUpgradeStarted,
        trackConnectionUpsellUpgradeSuccess,
    } = useUserActivityTelemetry();
    const [openSubscriptionModal, loadingSubscription] = useSubscriptionModal();
    const [upsellModalProps, setUpsellModalOpen, renderUpsellModal] = useModalState();

    useEffect(() => {
        trackConnectionUpsellShown();
    }, [trackConnectionUpsellShown]);

    return (
        <div className={wrapperClassName} style={{ '--max-w-custom': '16rem' }}>
            <img src={monitorGatewaysIllustration} alt="" width={56} height={56} />
            <p className="m-0 text-bold color-norm">{c('Members table usage').t`Monitor gateways connections`}</p>
            <p className="m-0">{c('Members table usage')
                .t`Setup your own private gateways to monitor VPN connection activity within your organization.`}</p>
            <Button
                shape="outline"
                size="small"
                onClick={() => {
                    trackConnectionUpsellLearnMoreClicked();
                    setUpsellModalOpen(true);
                }}
            >
                {c('Action').t`Learn more`}
            </Button>
            {renderUpsellModal && (
                <GatewayMonitorUpsellModal
                    modalProps={upsellModalProps}
                    upgradeLoading={loadingSubscription}
                    onUpgrade={() => {
                        trackConnectionUpsellUpgradeStarted();
                        setUpsellModalOpen(false);
                        void openSubscriptionModal({
                            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
                            defaultAudience: Audience.B2B,
                            onSubscribed: trackConnectionUpsellUpgradeSuccess,
                        });
                    }}
                />
            )}
        </div>
    );
};

const EnablePrompt = ({ onEnabled }: { onEnabled?: () => void }) => {
    const api = useApi();
    const { trackGatewayMonitorEnableClicked } = useUserActivityTelemetry();
    const [monitoringModalProps, setMonitoringModalOpen, renderMonitoringModal] = useModalState();
    const [submitting, setSubmitting] = useState(false);

    const handleEnable = async () => {
        trackGatewayMonitorEnableClicked();
        setSubmitting(true);
        try {
            await api(updateMonitoringSetting(true));
            setMonitoringModalOpen(true);
        } catch {
            // The (non-silent) api already surfaces the failure as an error notification; we only catch
            // here so a failed enable doesn't become an unhandled promise rejection.
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={wrapperClassName} style={{ '--max-w-custom': '16rem' }}>
            <p className="m-0 text-bold color-weak">{c('Members table usage').t`Gateway Monitor is off`}</p>
            <p className="m-0 color-hint">{c('Members table usage')
                .t`Turn it on to track when and where users connect.`}</p>
            <Button shape="outline" size="small" loading={submitting} onClick={handleEnable}>
                {c('Action').t`Enable`}
            </Button>
            {renderMonitoringModal && (
                <TogglingMonitoringModal
                    enabling={true}
                    onChange={() => {
                        setMonitoringModalOpen(false);
                        onEnabled?.();
                    }}
                    {...monitoringModalProps}
                />
            )}
        </div>
    );
};

interface Props {
    state: Extract<MemberUsageColumnState, 'upsell' | 'enable'>;
    onEnabled?: () => void;
}

/**
 * The whole-column prompt shown when a usage column is not in the "data" state:
 * "upsell" opens the upgrade flow, "enable" turns the gateway monitor on. Each branch is its own
 * component so it only instantiates the hooks it needs.
 */
const MemberUsageColumnPrompt = ({ state, onEnabled }: Props) =>
    state === 'upsell' ? <UpsellPrompt /> : <EnablePrompt onEnabled={onEnabled} />;

export default MemberUsageColumnPrompt;
