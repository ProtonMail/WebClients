import { useEffect } from 'react';

import { featureTourActions, selectFeatureTour } from '@proton/account/featuresTour';
import { remindMeLaterAboutFeatureTourAction } from '@proton/account/featuresTour/actions';
import Modal from '@proton/components/components/modalTwo/Modal';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { useDispatch, useSelector } from '@proton/redux-shared-store';
import useFlag from '@proton/unleash/useFlag';

import { useModalStateObject } from '../modalTwo/useModalState';
import FeatureTourSteps from './FeatureTourSteps';

import './FeatureTour.scss';

const FeatureTour = () => {
    const dispatch = useDispatch();
    const featureTourState = useSelector(selectFeatureTour);
    const isFeatureTourVisible = featureTourState.display;
    const isFeatureTourEnabled = useFlag('InboxWebPostSubscriptionFlow');
    const featureTourExpirationDateFlag = useFeature(FeatureCode.FeatureTourExpirationDate);
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
        },
    });

    useEffect(() => {
        if (isFeatureTourVisible === true) {
            modalState.openModal(true);
        }
    }, [isFeatureTourVisible]);

    if (!isFeatureTourEnabled || !isFeatureTourVisible || !modalState.render) {
        return null;
    }

    return (
        <Modal {...modalState.modalProps} className="modal-two--feature-tour">
            <FeatureTourSteps stepsList={featureTourState.steps} onClose={modalState.modalProps.onClose} />
        </Modal>
    );
};

export default FeatureTour;
