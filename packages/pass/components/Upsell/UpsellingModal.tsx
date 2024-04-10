import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import monitorSVG from '@proton/pass/assets/monitoring/upgrade.svg';
import onboardingSVG from '@proton/pass/assets/onboarding.svg';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { type AdapativeModalProps, AdaptiveModal } from '@proton/pass/components/Layout/Modal/AdaptiveModal';
import { type UpsellRef } from '@proton/pass/constants';

import { FreeTrialActions } from './FreeTrialActions';
import { UpsellFeatures } from './UpsellFeatures';

type UpsellModalContent = {
    description?: string;
    title: string;
    upgradeLabel: string;
    image: string;
};

export type UpsellType = 'free-trial' | 'pass-plus' | 'early-access' | 'pass-monitor';

export type Props = Omit<AdapativeModalProps, 'actions'> & {
    extraActions?: (props: AdapativeModalProps) => ReactNode[];
    features?: ReactNode;
    upgradePath?: string;
    upsellRef: UpsellRef;
    upsellType: UpsellType;
};

const getContent = (type: UpsellType): UpsellModalContent =>
    ({
        'free-trial': {
            title: c('Title').t`Your welcome gift`,
            description: undefined,
            upgradeLabel: c('Action').t`Upgrade now`,
            image: onboardingSVG,
        },
        'pass-plus': {
            title: 'Pass Plus',
            description: c('Info')
                .t`Get unlimited aliases, enjoy exclusive features, and support us by subscribing to Pass Plus.`,
            upgradeLabel: c('Action').t`Upgrade`,
            image: onboardingSVG,
        },
        'early-access': {
            title: c('Info').t`Upgrade Now to Unlock Premium Features`,
            description: undefined,
            upgradeLabel: c('Action').t`Upgrade now`,
            image: onboardingSVG,
        },
        'pass-monitor': {
            title: c('Title').t`Stay safer online`,
            description: c('Description')
                .t`Dark Web Monitoring is available with a paid plan. Upgrade for immediate access.`,
            upgradeLabel: c('Action').t`Get Pass Plus`,
            image: monitorSVG,
        },
    })[type];

export const UpsellingModal: FC<Props> = ({
    extraActions,
    features,
    size = 'medium',
    type,
    upgradePath,
    upsellRef,
    upsellType,
    ...props
}) => {
    const { title, description, upgradeLabel, image } = getContent(upsellType);

    return (
        <AdaptiveModal
            {...props}
            type={type}
            size={size}
            actions={[
                <UpgradeButton
                    key="upgrade-button"
                    label={upgradeLabel}
                    onClick={props.onClose}
                    path={upgradePath}
                    upsellRef={upsellRef}
                />,
                ...(extraActions?.(props) ?? []),
            ]}
        >
            <div className="flex flex-column items-center w-full gap-5 m-auto">
                <img src={image} className="w-3/5 " alt="user onboarding graphic" />
                <h4 className="text-bold">{title}</h4>
                {description && <p className="m-2 text-md">{description}</p>}
                {features ?? <UpsellFeatures upsellType={upsellType} />}
                {upsellType === 'free-trial' && <FreeTrialActions />}
            </div>
        </AdaptiveModal>
    );
};
