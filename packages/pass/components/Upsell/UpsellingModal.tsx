import type { FC, ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { BRAND_NAME, DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';

import monitorSVG from '../../assets/monitor/upgrade.svg';
import onboardingSVG from '../../assets/onboarding.svg';
import type { UpsellRef } from '../../constants';
import { shouldUpsellUnlimited } from '../../lib/user/user.plan';
import { selectB2BUpsell, selectUserPlan } from '../../store/selectors/user';
import type { Maybe } from '../../types/utils';
import { type AdapativeModalProps, AdaptiveModal } from '../Layout/Modal/AdaptiveModal';
import { B2BContactAdminModal } from './B2BContactAdminModal';
import { FreeTrialActions } from './FreeTrialActions';
import { UpgradeButton } from './UpgradeButton';
import { UpsellFeatures } from './UpsellFeatures';

type UpsellModalContent = {
    description?: string;
    title: string;
    upgradeLabel: string;
    image: string;
};

export type UpsellType = 'free-trial' | 'pass-plus' | 'early-access' | 'pass-monitor' | 'pass-monitor-business';

export type Props = Omit<AdapativeModalProps, 'actions'> & {
    extraActions?: (props: AdapativeModalProps) => ReactNode[];
    features?: ReactNode;
    upgradePath?: string;
    upsellRef: UpsellRef;
    upsellType: UpsellType;
};

// translator: planName is a plan name, e.g. "Proton Unlimited" or "Pass Professional"
const getPlanUpgradeLabel = (planName: string) => c('pass_upsell_2026: Action').t`Get ${planName}`;

const getUnlimitedContent = (type: UpsellType): Maybe<UpsellModalContent> => {
    const unlimited = PLAN_NAMES[PLANS.BUNDLE];

    switch (type) {
        case 'pass-plus':
            return {
                title: unlimited,
                description: c('Info')
                    .t`Get unlimited aliases, enjoy exclusive features, and unlock all premium ${BRAND_NAME} services by upgrading to ${unlimited}.`,
                upgradeLabel: c('Action').t`Upgrade`,
                image: onboardingSVG,
            };
        case 'pass-monitor':
            return {
                title: c('Title').t`Stay safer online`,
                description: c('Description')
                    .t`${DARK_WEB_MONITORING_NAME} is available with ${unlimited}. Upgrade for immediate access.`,
                upgradeLabel: getPlanUpgradeLabel(unlimited),
                image: monitorSVG,
            };
    }
};

const getContent = (type: UpsellType): UpsellModalContent => {
    const passProfessional = PLAN_NAMES[PLANS.PASS_BUSINESS];

    return {
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
                .t`${DARK_WEB_MONITORING_NAME} is available with a paid plan. Upgrade for immediate access.`,
            upgradeLabel: c('Action').t`Get Pass Plus`,
            image: monitorSVG,
        },
        'pass-monitor-business': {
            title: c('Title').t`Stay safer online`,
            description: c('Description')
                .t`Unlock advanced security features and detailed logs to safeguard your online presence.`,
            upgradeLabel: getPlanUpgradeLabel(passProfessional),
            image: monitorSVG,
        },
    }[type];
};

const getB2BContent = (): UpsellModalContent => ({
    title: c('Title').t`Upgrade your plan`,
    description: c('Info').t`This feature is not supported in your plan. Upgrade to unlock it for your organization.`,
    upgradeLabel: c('Action').t`Upgrade`,
    image: onboardingSVG,
});

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
    const b2bUpsell = useSelector(selectB2BUpsell);
    const upsellUnlimited = shouldUpsellUnlimited(useSelector(selectUserPlan));

    if (b2bUpsell && !b2bUpsell.admin) return <B2BContactAdminModal {...props} type={type} size={size} />;

    const unlimitedContent = !b2bUpsell && upsellUnlimited ? getUnlimitedContent(upsellType) : undefined;
    const { title, description, upgradeLabel, image } = b2bUpsell
        ? getB2BContent()
        : (unlimitedContent ?? getContent(upsellType));

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
                    path={b2bUpsell ? undefined : upgradePath}
                    plan={unlimitedContent ? PLANS.BUNDLE : undefined}
                    upsellRef={upsellRef}
                />,
                ...(extraActions?.(props) ?? []),
            ]}
        >
            <div className="flex flex-column items-center w-full gap-4 m-auto">
                <img
                    src={image}
                    className="w-3/5 max-w-custom"
                    style={{ '--max-w-custom': '18rem' }}
                    alt="user onboarding graphic"
                />
                <h4 className="text-bold">{title}</h4>
                {description && <p className="m-2 text-md">{description}</p>}
                {!b2bUpsell && (features ?? <UpsellFeatures upsellType={upsellType} />)}
                {upsellType === 'free-trial' && <FreeTrialActions />}
            </div>
        </AdaptiveModal>
    );
};
