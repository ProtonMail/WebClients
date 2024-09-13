import type { ReactElement, ReactNode } from 'react';
import { cloneElement } from 'react';

import { Scroll } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
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
                    <div className="flex-1 hidden md:flex">
                        {cloneElement(img, {
                            className: 'h-full',
                            style: {
                                objectFit: 'cover',
                            },
                        })}
                    </div>
                    <div className="flex-1">
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
