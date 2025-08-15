import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useUserSettings, userSettingsThunk } from '@proton/account';
import useApi from '@proton/components/hooks/useApi';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { enableHighSecurity } from '@proton/shared/lib/api/settings';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';
import illustration from '@proton/styles/assets/img/illustrations/check.svg';

import { SUBSCRIPTION_STEPS } from '../../constants';
import type { PostSubscriptionModalComponentProps } from '../interface';
import {
    PostSubscriptionModalContent,
    PostSubscriptionModalLoadingContent,
    PostSubscriptionModalWrapper,
} from './PostSubscriptionModalsComponents';

const SentinelPostSubscriptionModal = (props: PostSubscriptionModalComponentProps) => {
    const { modalProps, step, onDisplayFeatureTour, onRemindMeLater } = props;
    const [displayLoadingModal, setDisplayLoadingModal] = useState(true);
    const api = useApi();
    const [userSettings] = useUserSettings();
    const dispatch = useDispatch();
    const isPremiumFeatureEnabled = userSettings.HighSecurity.Value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED;

    const isSetupActionDoneRef = useRef(false);

    useEffect(() => {
        if (step === SUBSCRIPTION_STEPS.THANKS && !isSetupActionDoneRef.current) {
            const setupAction = async () => {
                if (!isPremiumFeatureEnabled) {
                    await api(enableHighSecurity());
                    await dispatch(userSettingsThunk({ cache: CacheType.None }));
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
    const feature = PROTON_SENTINEL_NAME;

    return (
        <PostSubscriptionModalWrapper {...modalProps} canClose={canCloseModal}>
            {canCloseModal ? (
                <PostSubscriptionModalContent
                    title={c('Title').t`Upgrade complete!`}
                    subtitle={c('Title').t`${feature} is now active`}
                    description={c('Info')
                        .t`${PROTON_SENTINEL_NAME} protects your account with dedicated monitoring of suspicious activity.`}
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
                            : // translator: complete sentence: Setting up Proton Sentinel…
                              c('Info').t`Setting up ${feature}…`
                    }
                />
            )}
        </PostSubscriptionModalWrapper>
    );
};

export default SentinelPostSubscriptionModal;
