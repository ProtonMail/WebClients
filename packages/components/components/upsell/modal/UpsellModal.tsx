import type { ReactNode } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import type { ModalSize, ModalStateProps } from '@proton/components/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components/components';
import Icon, { type IconSize } from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import calendarHeaderImage from '@proton/styles/assets/img/illustrations/upsell-calendar-header.svg';
import composerAssistantImage from '@proton/styles/assets/img/illustrations/upsell-composer-assistant.svg';
import mailHeaderImage from '@proton/styles/assets/img/illustrations/upsell-mail-header.svg';
import clsx from '@proton/utils/clsx';

import type { UpsellFeatureName } from './constants';
import { upsellFeatures } from './constants';

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
    Pick<
        UpsellModalProps,
        | 'hideInfo'
        | 'submitText'
        | 'submitButton'
        | 'featuresDescription'
        | 'hideFeaturesListBorder'
        | 'footerText'
        | 'iconSize'
    > & {
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
    hideFeaturesListBorder = false,
    footerText,
    iconSize = 5,
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
                <div className={clsx(['color-weak mb-4', hideFeaturesListBorder ? undefined : 'px-4'])}>
                    {description}
                </div>
            </div>

            {features.length ? (
                <>
                    <div
                        className={clsx([
                            'pt-4',
                            hideFeaturesListBorder ? undefined : 'p-6 border border-primary rounded',
                        ])}
                    >
                        {featuresDescription}
                        <ul className={clsx('m-0 unstyled', submitPosition === 'inside' && 'mb-4')}>
                            {features.map((featureName) => {
                                const feature = upsellFeatures[featureName];
                                return (
                                    <li className="py-2 rounded" key={feature.getText()}>
                                        <div className="flex flex-nowrap items-center">
                                            <div className="mr-3 shrink-0 flex">
                                                <Icon
                                                    className="color-primary m-auto"
                                                    size={iconSize}
                                                    name={feature.icon}
                                                />
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
                        {submitPosition === 'inside' && (
                            <>
                                {UpgradeButton}
                                {footerText && <div className="color-weak text-center">{footerText}</div>}
                            </>
                        )}
                    </div>

                    {submitPosition === 'outside' && (
                        <>
                            <div className="mt-4">{UpgradeButton}</div>
                            {footerText && <div className="mt-4 color-weak text-center">{footerText}</div>}
                        </>
                    )}
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
    submitText?: ReactNode;
    submitPosition?: 'inside' | 'outside';
    /**
     * Overrides `submitText`, `position` and `handleUpgrade` as it is a ReactNode
     * replacing submit button
     */
    submitButton?: ReactNode;
    hideFeaturesListBorder?: boolean;
    footerText?: ReactNode;
    iconSize?: IconSize;
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
    hideFeaturesListBorder,
    footerText,
    iconSize,
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
                    hideFeaturesListBorder={hideFeaturesListBorder}
                    footerText={footerText}
                    iconSize={iconSize}
                />
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default UpsellModal;
