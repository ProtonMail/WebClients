import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    Icon,
    Info,
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    useSettingsLink,
} from '@proton/components/components';
import headerImage from '@proton/styles/assets/img/illustrations/upsell-header.svg';

import { UpsellFeatureName, upsellFeatures } from './constants';

type UpsellBoxProps = Required<
    Pick<UpsellModalProps, 'description' | 'title' | 'features'> & { handleUpgrade: () => void }
>;

const UpsellBox = ({ description, handleUpgrade, title, features }: UpsellBoxProps) => (
    <div>
        <div className="text-center">
            <div className="mb-4 rounded">
                <img
                    src={headerImage}
                    className="w-full block"
                    alt={c('Description').t`ProtonMail logo and a plus sign`}
                />
            </div>
            <h1 className="h3 text-bold mb-4">{title}</h1>
            <div className="color-weak mb-4 px-4">{description}</div>
        </div>

        <div className="border border-primary rounded p-6 pt-4">
            <ul className="m-0 unstyled mb-4">
                {features.map((featureName) => {
                    const feature = upsellFeatures[featureName];
                    return (
                        <li className="py-2 rounded" key={feature.getText()}>
                            <div className="flex flex-nowrap flex-align-items-center">
                                <div className="mr-3 flex-item-noshrink flex">
                                    <Icon className="color-primary m-auto" size={20} name={feature.icon} />
                                </div>
                                <div className="flex-item-fluid">
                                    {feature.getText()}
                                    {feature.getTooltip ? (
                                        <Info buttonClass="ml-2" title={feature.getTooltip()} />
                                    ) : null}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
            <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>{c('new_plans: Action')
                .t`Upgrade now`}</Button>
        </div>
    </div>
);

export interface UpsellModalProps {
    ['data-testid']?: string;
    description: string;
    features: UpsellFeatureName[];
    modalProps: ModalStateProps;
    title: string;
    upsellRef: string;
    onClose?: () => void;
}

const UpsellModal = ({
    description,
    features,
    modalProps,
    title,
    upsellRef,
    'data-testid': dataTestid,
    onClose,
}: UpsellModalProps) => {
    const goToSettings = useSettingsLink();
    const handleUpgrade = () => {
        goToSettings(`/upgrade?ref=${upsellRef}`, undefined, false);
        modalProps.onClose();
    };

    const handleClose = () => {
        onClose?.();
        modalProps.onClose();
    };

    return (
        <ModalTwo data-testid={dataTestid} {...modalProps} onClose={handleClose}>
            <ModalTwoHeader />
            <ModalTwoContent>
                <UpsellBox title={title} description={description} features={features} handleUpgrade={handleUpgrade} />
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default UpsellModal;
