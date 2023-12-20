import { type FC } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import onboardingSVG from '@proton/pass/assets/onboarding.svg';
import { PromotionUpgradeButton } from '@proton/pass/components/Layout/Button/PromotionUpgradeButton';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { AdaptiveModal } from '@proton/pass/components/Layout/Modal/AdaptiveModal';
import { FreeTrialContent } from '@proton/pass/components/Spotlight/FreeTrialContent';
import { PASS_EOY_DATE_END, PASS_SENTINEL_LINK } from '@proton/pass/constants';
import { PASS_APP_NAME, PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

export type Props = Omit<ModalProps, 'onSubmit'> & { type: UpsellingModalType };
export type UpsellingModalType = 'free-trial' | 'pass-plus' | 'early-access';

interface OfferFeatures {
    className: string;
    icon: IconName;
    label: string | string[];
    key: string;
}

interface UpsellModalContent {
    title: string;
    description?: string;
    upgradeLabel: string;
}

const PROTON_SENTINEL_LINK = (
    <a href={PASS_SENTINEL_LINK} target="_blank" key="sentinel-link">
        {PROTON_SENTINEL_NAME}
    </a>
);

const getFeatures = (): OfferFeatures[] => [
    {
        key: 'web',
        className: 'ui-purple',
        icon: 'tv',
        label: c('Info').t`Early access to ${PASS_APP_NAME} web app`,
    },
    {
        key: 'aliases',
        className: 'ui-teal',
        icon: 'alias',
        label: c('Info').t`Unlimited hide-my-email aliases`,
    },
    {
        key: '2FA',
        className: 'ui-orange',
        icon: 'pass-circles',
        label: c('Info').t`Built in 2FA authenticator`,
    },
    {
        key: 'logins',
        className: 'ui-red',
        icon: 'users-plus',
        label: c('Info').t`Share your logins, secure notes, with up to 10 people`,
    },
    {
        key: 'protected',
        className: 'ui-lime',
        icon: 'list-bullets',
        label:
            // translator: full sentence is Protected by Proton Sentinel, our advanced account protection program
            c('Info').jt`Protected by ${PROTON_SENTINEL_LINK}, our advanced account protection program`,
    },
];

export const isEOY = () => +new Date() < PASS_EOY_DATE_END;

const getContent = (type: UpsellingModalType): UpsellModalContent =>
    ({
        'free-trial': {
            title: 'Your welcome gift',
            description: undefined,
            upgradeLabel: c('Action').t`Upgrade now`,
        },
        'pass-plus': {
            title: 'Pass Plus',
            description: c('Info')
                .t`Get unlimited aliases, enjoy exclusive features, and support us by subscribing to Pass Plus.`,
            upgradeLabel: c('Action').t`Upgrade`,
        },
        'early-access': {
            title: isEOY()
                ? c('Info').t`Save up to 60% on ${PASS_APP_NAME} Plus`
                : c('Info').t`Upgrade Now to Unlock Premium Features`,
            description: undefined,
            upgradeLabel: c('Action').t`Upgrade now`,
        },
    })[type];

export const UpsellingModal: FC<Props> = ({ type, ...props }) => {
    const { title, description, upgradeLabel } = getContent(type);
    const features = getFeatures();

    return (
        <AdaptiveModal
            {...props}
            size="medium"
            actions={[
                type === 'early-access' && isEOY() ? (
                    <PromotionUpgradeButton key="promo-upgrade-button" />
                ) : (
                    <UpgradeButton key="upgrade-button" label={upgradeLabel} />
                ),
            ]}
        >
            <div className="flex flex-column items-center w-full gap-5 m-auto">
                <img src={onboardingSVG} className="w-3/5 " alt="user onboarding graphic" />
                <h3 className="text-bold ">{title}</h3>
                {description && <p className="m-2 text-md">{description}</p>}

                <Card
                    rounded
                    bordered={false}
                    className="w-full m-auto rounded-lg"
                    style={{ backgroundColor: 'var(--field-norm)', padding: '0 1rem' }}
                >
                    {features.map(({ className, icon, label, key }, idx) => (
                        <div
                            className={clsx(
                                'flex justify-start items-center py-3 gap-3',
                                idx < features.length - 1 && 'border-bottom',
                                className
                            )}
                            key={key}
                        >
                            <Icon color="var(--interaction-norm)" name={icon} size={18} />
                            <div className="text-left flex-1">{label}</div>
                        </div>
                    ))}
                </Card>
                {type === 'free-trial' && <FreeTrialContent />}
            </div>
        </AdaptiveModal>
    );
};
