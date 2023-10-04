import React from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import {
    Icon,
    Info,
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    SettingsLink,
} from '@proton/components/components';
import calendarHeaderImage from '@proton/styles/assets/img/illustrations/upsell-calendar-header.svg';
import mailHeaderImage from '@proton/styles/assets/img/illustrations/upsell-mail-header.svg';

import { UpsellFeatureName, upsellFeatures } from './constants';

export type UpsellHeaderType = 'mail' | 'calendar';
const getHeader = (headerType: UpsellHeaderType) => {
    switch (headerType) {
        case 'mail':
            return mailHeaderImage;
        case 'calendar':
            return calendarHeaderImage;
    }
};

type UpsellBoxProps = Partial<Pick<UpsellModalProps, 'hideInfo'>> &
    Required<
        Pick<UpsellModalProps, 'description' | 'title' | 'features'> & {
            handleUpgrade: () => void;
            headerType: UpsellHeaderType;
            path: string;
        }
    >;

const UpsellBox = ({ description, handleUpgrade, title, features, hideInfo, headerType, path }: UpsellBoxProps) => (
    <div>
        <div className="text-center">
            <div className="mb-4 rounded">
                <img
                    src={getHeader(headerType)}
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
                                    {feature.getTooltip && !hideInfo ? (
                                        <Info buttonClass="ml-2" title={feature.getTooltip()} />
                                    ) : null}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
            <ButtonLike
                as={SettingsLink}
                path={path}
                onClick={handleUpgrade}
                size="large"
                color="norm"
                shape="solid"
                fullWidth
            >
                {c('new_plans: Action').t`Upgrade now`}
            </ButtonLike>
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
    headerType?: UpsellHeaderType;
    hideInfo?: boolean;
}

const UpsellModal = ({
    description,
    features,
    hideInfo,
    modalProps,
    title,
    upsellRef,
    'data-testid': dataTestid,
    onClose,
    headerType = 'mail',
}: UpsellModalProps) => {
    const handleUpgrade = () => {
        modalProps.onClose();
    };

    const handleClose = () => {
        onClose?.();
        modalProps.onClose();
    };

    return (
        <ModalTwo data-testid={dataTestid} {...modalProps} onClose={handleClose}>
            <ModalTwoHeader />
            <ModalTwoContent className="my-8">
                <UpsellBox
                    title={title}
                    description={description}
                    features={features}
                    handleUpgrade={handleUpgrade}
                    headerType={headerType}
                    path={`/upgrade?ref=${upsellRef}`}
                    hideInfo={hideInfo}
                />
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default UpsellModal;
