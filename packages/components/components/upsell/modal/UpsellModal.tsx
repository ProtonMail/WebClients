import React from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import {
    Icon,
    Info,
    ModalSize,
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    SettingsLink,
} from '@proton/components/components';
import calendarHeaderImage from '@proton/styles/assets/img/illustrations/upsell-calendar-header.svg';
import mailHeaderImage from '@proton/styles/assets/img/illustrations/upsell-mail-header.svg';

import { UpsellFeatureName, upsellFeatures } from './constants';

type UpsellHeaderType = 'mail' | 'calendar';
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

const UpsellBox = ({ description, handleUpgrade, title, features, hideInfo, headerType, path }: UpsellBoxProps) => {
    const UpgradeButton = (
        <ButtonLike
            as={path ? SettingsLink : undefined}
            path={path}
            onClick={handleUpgrade}
            size="large"
            color="norm"
            shape="solid"
            fullWidth
        >
            {c('new_plans: Action').t`Upgrade now`}
        </ButtonLike>
    );
    return (
        <div>
            <div className="text-center">
                <div className="mb-4 rounded">
                    <img src={getHeader(headerType)} className="w-full block" alt="" />
                </div>
                <h1 className="h3 text-bold mb-4">{title}</h1>
                <div className="color-weak mb-4 px-4">{description}</div>
            </div>

            {features.length ? (
                <div className="border border-primary rounded p-6 pt-4">
                    <ul className="m-0 unstyled mb-4">
                        {features.map((featureName) => {
                            const feature = upsellFeatures[featureName];
                            return (
                                <li className="py-2 rounded" key={feature.getText()}>
                                    <div className="flex flex-nowrap items-center">
                                        <div className="mr-3 shrink-0 flex">
                                            <Icon className="color-primary m-auto" size={5} name={feature.icon} />
                                        </div>
                                        <div className="flex-1">
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
                    {UpgradeButton}
                </div>
            ) : (
                UpgradeButton
            )}
        </div>
    );
};

export interface UpsellModalProps {
    ['data-testid']?: string;
    description: string;
    features: UpsellFeatureName[];
    modalProps: ModalStateProps;
    title: string;
    upgradePath: string;
    onClose?: () => void;
    onUpgrade?: () => void;
    headerType?: UpsellHeaderType;
    hideInfo?: boolean;
    size?: ModalSize;
}

const UpsellModal = ({
    description,
    features,
    hideInfo,
    modalProps,
    title,
    upgradePath,
    'data-testid': dataTestid,
    onClose,
    onUpgrade,
    headerType = 'mail',
    size,
}: UpsellModalProps) => {
    const handleUpgrade = () => {
        onUpgrade?.();
        modalProps.onClose();
    };

    const handleClose = () => {
        onClose?.();
        modalProps.onClose();
    };

    return (
        <ModalTwo data-testid={dataTestid} {...modalProps} onClose={handleClose} size={size}>
            <ModalTwoHeader />
            <ModalTwoContent className="mb-8">
                <UpsellBox
                    title={title}
                    description={description}
                    features={features}
                    handleUpgrade={handleUpgrade}
                    headerType={headerType}
                    path={upgradePath}
                    hideInfo={hideInfo}
                />
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default UpsellModal;
