import LottieView from 'lottie-react';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoFooter } from '@proton/components';

import './WhatsNew.scss';

interface WhatsNewModalProps extends ModalProps {
    feature: {
        image: any;
        getTitle: () => string;
        getDescription: () => string;
    };
    onCallToAction: () => void;
    onCancel: () => void;
}

const WhatsNewModal = ({ feature, onCallToAction, onCancel, ...modalProps }: WhatsNewModalProps) => {
    return (
        <ModalTwo size="large" className="whats-new-modal p-4" enableCloseWhenClickOutside {...modalProps}>
            <div className="whats-new-content">
                <LottieView animationData={feature.image} loop={true} />
                <div className="flex flex-column flex-nowrap gap-2 px-8 py-4">
                    <h2 className="text-2xl text-semibold">{feature.getTitle()}</h2>
                    <p className="m-0 color-weak">{feature.getDescription()}</p>
                </div>
            </div>

            <ModalTwoFooter>
                <div className="flex flex-row flex-nowrap gap-2 mr-auto">
                    <Button size="medium" color="norm" onClick={onCallToAction}>{c('collider_2025: Button')
                        .t`Try it now`}</Button>
                    <Button size="medium" shape="outline" onClick={onCancel}>{c('collider_2025: Button')
                        .t`Maybe later`}</Button>
                </div>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default WhatsNewModal;
