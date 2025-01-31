import { Suspense, lazy, useEffect } from 'react';

import { type FeatureTourTelemetryFeature, featureTourActions, selectFeatureTour } from '@proton/account/featuresTour';
import { remindMeLaterAboutFeatureTourAction } from '@proton/account/featuresTour/actions';
import Modal from '@proton/components/components/modalTwo/Modal';
import { usePostSubscriptionTourTelemetry } from '@proton/components/hooks/mail/usePostSubscriptionTourTelemetry';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { useDispatch, useSelector } from '@proton/redux-shared-store';
import { TelemetryPostSubscriptionTourEvents } from '@proton/shared/lib/api/telemetry';
import useFlag from '@proton/unleash/useFlag';

import { useModalStateObject } from '../modalTwo/useModalState';
import FeatureTourLoader from './FeatureTourLoader';

const FeatureTourSteps = lazy(() => import(/* webpackChunkName: "FeatureTourSteps" */ './FeatureTourSteps'));

const FeatureTour = () => {
    const dispatch = useDispatch();
    const featureTourState = useSelector(selectFeatureTour);
    const isFeatureTourVisible = featureTourState.display;
    const isFeatureTourEnabled = useFlag('InboxWebPostSubscriptionFlow');
    const featureTourExpirationDateFlag = useFeature(FeatureCode.FeatureTourExpirationDate);
    const postSubscriptionTourTelemetry = usePostSubscriptionTourTelemetry();
    const isActiveFeature = (feature: FeatureTourTelemetryFeature) =>
        featureTourState.activatedFeatures.includes(feature) ? 'yes' : 'no';
    const modalState = useModalStateObject({
        onExit: () => {
            if (isFeatureTourVisible) {
                dispatch(featureTourActions.hide());
            }
        },
        onClose: () => {
            if (isFeatureTourVisible) {
                dispatch(featureTourActions.hide());
            }

            // If no expiration date is set, setup the remind me later action
            if (!featureTourExpirationDateFlag.feature?.Value) {
                void dispatch(remindMeLaterAboutFeatureTourAction());
            }

            void postSubscriptionTourTelemetry({
                event: TelemetryPostSubscriptionTourEvents.quit_feature_tour,
                dimensions: {
                    origin: featureTourState.origin,
                    activatedStepShortDomain: isActiveFeature('short-domain'),
                    activatedStepAutoDelete: isActiveFeature('auto-delete'),
                    activatedStepDarkWebMonitoring: isActiveFeature('dark-web-monitoring'),
                },
            });
        },
    });

    useEffect(() => {
        if (isFeatureTourVisible === true) {
            modalState.openModal(true);

            void postSubscriptionTourTelemetry({
                event: TelemetryPostSubscriptionTourEvents.start_feature_tour,
                dimensions: {
                    origin: featureTourState.origin,
                },
            });
        }
    }, [isFeatureTourVisible]);

    if (!isFeatureTourEnabled || !isFeatureTourVisible || !modalState.render) {
        return null;
    }

    const handleFinishFeatureTour = () => {
        modalState.openModal(false);

        void postSubscriptionTourTelemetry({
            event: TelemetryPostSubscriptionTourEvents.finish_feature_tour,
            dimensions: {
                origin: featureTourState.origin,
                activatedStepShortDomain: isActiveFeature('short-domain'),
                activatedStepAutoDelete: isActiveFeature('auto-delete'),
                activatedStepDarkWebMonitoring: isActiveFeature('dark-web-monitoring'),
            },
        });
    };

    return (
        <Suspense fallback={<FeatureTourLoader />}>
            <Modal {...modalState.modalProps} size="xsmall">
                <FeatureTourSteps stepsList={featureTourState.steps} onFinishTour={handleFinishFeatureTour} />
            </Modal>
        </Suspense>
    );
};

export default FeatureTour;
