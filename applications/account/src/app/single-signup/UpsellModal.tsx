import { ReactElement, ReactNode, cloneElement } from 'react';

import { Scroll } from '@proton/atoms/Scroll';
import { ModalProps, ModalTwo, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';

interface Props extends ModalProps {
    title: string;
    features: PlanCardFeatureDefinition[];
    info: string;
    footer: ReactNode;
    img: ReactElement;
}

const UpsellModal = ({ title, img, info, features, footer, ...rest }: Props) => {
    return (
        <ModalTwo {...rest} size="xlarge">
            <Scroll>
                <div className="flex flex-nowrap">
                    <div className="flex-item-fluid hidden md:flex">
                        {cloneElement(img, {
                            className: 'h-full',
                            style: {
                                objectFit: 'cover',
                            },
                        })}
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
