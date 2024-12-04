import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import { enableBreachAlert } from '@proton/shared/lib/api/settings';
import { DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';
import { DARK_WEB_MONITORING_STATE } from '@proton/shared/lib/interfaces';
import illustration from '@proton/styles/assets/img/illustrations/check.svg';

import { SUBSCRIPTION_STEPS } from '../../constants';
import type { PostSubscriptionModalComponentProps } from '../interface';
import {
    PostSubscriptionModalContent,
    PostSubscriptionModalLoadingContent,
    PostSubscriptionModalWrapper,
} from './PostSubscriptionModalsComponents';

const DarkWebMonitoringPostSubscriptionModal = (props: PostSubscriptionModalComponentProps) => {
    const { modalProps, step, onDisplayFeatureTour, onRemindMeLater } = props;
    const [displayLoadingModal, setDisplayLoadingModal] = useState(true);
    const api = useApi();
    const [userSettings] = useUserSettings();
    const { call } = useEventManager();
    const isPremiumFeatureEnabled = userSettings.BreachAlerts.Value === DARK_WEB_MONITORING_STATE.ENABLED;

    const isSetupActionDoneRef = useRef(false);

    useEffect(() => {
        if (step === SUBSCRIPTION_STEPS.THANKS && !isSetupActionDoneRef.current) {
            const setupAction = async () => {
                if (!isPremiumFeatureEnabled) {
                    await api(enableBreachAlert());
                    await call();
                } else {
                    return Promise.resolve();
                }
            };

            const hideLoadingModal = () => {
                setDisplayLoadingModal(false);
            };

            setupAction().then(hideLoadingModal, hideLoadingModal);
        }
    }, [step]);

    const canCloseModal = step === SUBSCRIPTION_STEPS.THANKS && !displayLoadingModal;
    const feature = DARK_WEB_MONITORING_NAME;

    return (
        <PostSubscriptionModalWrapper {...modalProps} canClose={canCloseModal}>
            {canCloseModal ? (
                <PostSubscriptionModalContent
                    title={c('Title').t`Upgrade complete!`}
                    subtitle={c('Title').t`${feature} is now active`}
                    description={c('Info')
                        .t`You get notified if your password or other data was leaked from a third-party service.`}
                    illustration={illustration}
                    primaryButtonText={c('Button').t`Set up other features`}
                    primaryButtonCallback={onDisplayFeatureTour}
                    secondaryButtonText={c('Button').t`Remind me later`}
                    secondaryButtonCallback={onRemindMeLater}
                />
            ) : (
                <PostSubscriptionModalLoadingContent
                    title={
                        step === SUBSCRIPTION_STEPS.UPGRADE
                            ? c('Info').t`Registering your subscription…`
                            : // translator: complete sentence: Setting up Dark Web Monitoring…
                              c('Info').t`Setting up ${feature}…`
                    }
                />
            )}
        </PostSubscriptionModalWrapper>
    );
};

export default DarkWebMonitoringPostSubscriptionModal;
