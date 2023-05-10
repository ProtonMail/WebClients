import { ReactNode } from 'react';

import { Scroll } from '@proton/atoms/Scroll';
import { ModalProps, ModalTwo, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';

interface Props extends ModalProps {
    title: string;
    features: PlanCardFeatureDefinition[];
    info: string;
    footer: ReactNode;
    imgs: string[];
}

const UpsellModal = ({ title, imgs, info, features, footer, ...rest }: Props) => {
    return (
        <ModalTwo {...rest} size="xlarge">
            <Scroll>
                <div className="flex flex-nowrap">
                    <div className="flex-item-fluid no-mobile">
                        <picture>
                            <source
                                media="(-webkit-min-device-pixel-ratio: 1.25), min-resolution: 1.25dppx"
                                srcSet={`${imgs[1]}`}
                            />
                            <img
                                className="h100"
                                src={imgs[0]}
                                srcSet={`${imgs[0]}, ${imgs[1]} 2x`}
                                alt=""
                                style={{
                                    objectFit: 'cover',
                                }}
                            />
                        </picture>
                    </div>
                    <div className="flex-item-fluid">
                        <ModalTwoHeader />
                        <div className="px-8">
                            <h1 className="h2 text-bold mb-6">{title}</h1>
                            <div className="mb-6">{info}</div>
                            <PlanCardFeatureList
                                odd={false}
                                margin={false}
                                features={features}
                                icon={false}
                                highlight={false}
                            />
                            <div className="mt-6">{footer}</div>
                        </div>
                        <ModalTwoFooter />
                    </div>
                </div>
            </Scroll>
        </ModalTwo>
    );
};

export default UpsellModal;
