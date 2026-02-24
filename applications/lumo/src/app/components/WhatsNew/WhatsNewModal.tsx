import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Pill } from '@proton/atoms/Pill/Pill';
import type { ModalProps } from '@proton/components';
import { Icon, ModalContent, ModalTwo, ModalTwoFooter } from '@proton/components';
import lumoProjects from '@proton/styles/assets/img/lumo/lumo-projects.svg';

import { LazyLottie } from '../LazyLottie';
import type { FeaturePoint, WhatsNewModalFeature } from './types';

import './WhatsNew.scss';

interface WhatsNewModalProps extends ModalProps {
    feature: WhatsNewModalFeature;
    onCallToAction: () => void;
    onCancel: () => void;
}

const WhatsNewModal = ({ feature, onCallToAction, onCancel, ...modalProps }: WhatsNewModalProps) => {
    return (
        <ModalTwo size="large" className="whats-new-modal p-4" enableCloseWhenClickOutside {...modalProps}>
            {feature.lottieAnimation && (
                <LazyLottie getAnimationData={feature.lottieAnimation} loop={true} className="pb-3 md:pb-4" />
            )}
            <div className="background flex items-center justify-center rounded mb-2">
                <img src={lumoProjects} alt="Projects" className="mt-5" />
            </div>
            <ModalContent>
                <div className="whats-new-content">
                    <div className="flex flex-column flex-nowrap gap-2">
                        <Pill backgroundColor="#D4EFD2" rounded="rounded-sm" className="self-start">{c(
                            'collider_2025: Feature'
                        ).t`New`}</Pill>
                        <h2 className="text-2xl text-semibold">{feature.getTitle()}</h2>
                        {feature.getDescription && <p className="m-0 color-weak">{feature.getDescription()}</p>}
                        {feature.getFeaturePoints && (
                            <ul className="unstyled my-0">
                                {feature.getFeaturePoints().map((point: FeaturePoint) => (
                                    <li
                                        key={point.icon}
                                        className="feature-point flex flex-nowrap items-center gap-3 my-2"
                                    >
                                        {point.svg ? (
                                            point.svg
                                        ) : (
                                            <Icon name={point.icon} className="shrink-0" size={4} />
                                        )}
                                        <span>{point.getText()}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </ModalContent>

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
