import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { SUBSCRIPTION_STEPS } from '@proton/components';
import { useSubscriptionModalRaw } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { hasDuo, hasFamily, hasVisionary } from '@proton/payments';
import type { FreeSubscription, Subscription } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { TransferManagerBannerType } from '../transferManager.store';

interface BannerConfig {
    icon: ReactNode;
    title: string;
    description?: string;
    button: ReactNode;
    color: 'danger' | 'warning' | 'info';
    iconBackgroundColor?: string;
    enabled: (subscription: Subscription | FreeSubscription | undefined) => boolean;
}

const colorClasses: Record<BannerConfig['color'], string> = {
    danger: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-info',
};

interface TransferManagerBannerProps {
    type: TransferManagerBannerType;
    onAction: () => void;
    className?: string;
    subscription?: Subscription | FreeSubscription;
}

export const TransferManagerBanner = ({ type, onAction, className, subscription }: TransferManagerBannerProps) => {
    const openSubscriptionModal = useSubscriptionModalRaw();
    const telemetryFlow = useDashboardPaymentFlow(APPS.PROTONDRIVE);

    const configs: Record<TransferManagerBannerType, BannerConfig> = {
        [TransferManagerBannerType.StorageFull]: {
            icon: <IcStorage size={8} />,
            title: c('Title').t`Out of storage space`,
            description: c('Info').t`Upgrade to get more storage space`,
            button: (
                <Button
                    className="flex-shrink-0"
                    color="norm"
                    size="medium"
                    shape="outline"
                    onClick={() => {
                        void openSubscriptionModal({
                            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
                            telemetryFlow,
                        });
                        onAction();
                    }}
                >
                    {c('Action').t`Add storage`}
                </Button>
            ),
            color: 'danger',
            iconBackgroundColor: 'var(--signal-danger-major-3)',
            enabled: (sub) => sub !== undefined && !hasDuo(sub) && !hasFamily(sub) && !hasVisionary(sub),
        },
    };

    const config = configs[type];

    if (!config.enabled(subscription)) {
        return null;
    }

    const { icon, title, description, button, color, iconBackgroundColor } = config;

    return (
        <div
            className={clsx('bg-danger flex items-center rounded-lg h-custom overflow-hidden', className)}
            style={{ '--h-custom': '4rem' }}
        >
            <div
                className={clsx(
                    'w-custom h-full flex-shrink-0 flex items-center justify-center rounded-lg',
                    colorClasses[color]
                )}
                style={{ '--w-custom': '4rem', backgroundColor: iconBackgroundColor }}
            >
                {icon}
            </div>
            <div className="h-full flex-1 flex items-center gap-3 px-3">
                <div className="flex-1">
                    <p className="m-0 text-bold">{title}</p>
                    {description && <p className="m-0 text-sm">{description}</p>}
                </div>
                {button}
            </div>
        </div>
    );
};
