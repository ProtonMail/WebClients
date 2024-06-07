import React, { ReactNode } from 'react';

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
import composerAssistantImage from '@proton/styles/assets/img/illustrations/upsell-composer-assistant.svg';
import mailHeaderImage from '@proton/styles/assets/img/illustrations/upsell-mail-header.svg';
import clsx from '@proton/utils/clsx';

import { UpsellFeatureName, upsellFeatures } from './constants';

type UpsellHeaderType = 'mail' | 'calendar' | 'composer-assistant';
const getHeader = (headerType: UpsellHeaderType) => {
    switch (headerType) {
        case 'mail':
            return mailHeaderImage;
        case 'calendar':
            return calendarHeaderImage;
        case 'composer-assistant':
            return composerAssistantImage;
    }
};

type UpsellBoxProps = Partial<
    Pick<UpsellModalProps, 'hideInfo' | 'submitText' | 'submitButton' | 'featuresDescription'> & {
        path: string;
    }
> &
    Required<Pick<UpsellModalProps, 'description' | 'title' | 'features' | 'submitPosition'>> & {
        handleUpgrade: () => void;
        headerType: UpsellHeaderType;
    };

const UpsellBox = ({
    description,
    handleUpgrade,
    title,
    features,
    featuresDescription,
    hideInfo,
    headerType,
    path,
    submitText,
    submitPosition,
    submitButton,
}: UpsellBoxProps) => {
    const UpgradeButton = submitButton || (
        <ButtonLike
            as={path ? SettingsLink : undefined}
            path={path || ''}
            onClick={handleUpgrade}
            size="large"
            color="norm"
            shape="solid"
            fullWidth
        >
            {submitText || c('new_plans: Action').t`Upgrade now`}
        </ButtonLike>
    );

    return (
        <div>
            <div className="text-center">
                <div className="mb-4 rounded">
                    <img
                        src={getHeader(headerType)}
                        className={clsx('block', headerType === 'composer-assistant' ? 'my-0 mx-auto' : 'w-full')}
                        width={headerType === 'composer-assistant' ? 180 : undefined}
                        alt=""
                    />
                </div>
                <h1 className="h3 text-bold mb-4">{title}</h1>
                <div className="color-weak mb-4 px-4">{description}</div>
            </div>

            {features.length ? (
                <>
                    <div className="border border-primary rounded p-6 pt-4">
                        {featuresDescription}
                        <ul className={clsx('m-0 unstyled', submitPosition === 'inside' && 'mb-4')}>
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
                        {submitPosition === 'inside' && UpgradeButton}
                    </div>

                    {submitPosition === 'outside' && <div className="mt-4">{UpgradeButton}</div>}
                </>
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
    featuresDescription?: ReactNode;
    modalProps: ModalStateProps;
    title: ReactNode;
    upgradePath?: string;
    onClose?: () => void;
    onUpgrade?: () => void;
    headerType?: UpsellHeaderType;
    hideInfo?: boolean;
    size?: ModalSize;
    submitText?: string;
    submitPosition?: 'inside' | 'outside';
    /**
     * Overrides `submitText`, `position` and `handleUpgrade` as it is a ReactNode
     * replacing submit button
     */
    submitButton?: ReactNode;
}

const UpsellModal = ({
    description,
    features,
    featuresDescription,
    hideInfo,
    modalProps,
    title,
    upgradePath,
    'data-testid': dataTestid,
    onClose,
    onUpgrade,
    headerType = 'mail',
    size,
    submitText,
    submitPosition = 'inside',
    submitButton,
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
                    featuresDescription={featuresDescription}
                    features={features}
                    handleUpgrade={handleUpgrade}
                    headerType={headerType}
                    path={upgradePath}
                    hideInfo={hideInfo}
                    submitText={submitText}
                    submitPosition={submitPosition}
                    submitButton={submitButton}
                />
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default UpsellModal;
