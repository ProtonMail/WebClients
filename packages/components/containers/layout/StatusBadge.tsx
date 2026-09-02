import type { ComponentPropsWithoutRef } from 'react';

import type { IconComponent } from '@proton/icons/component';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcCircleRadioEmpty } from '@proton/icons/icons/IcCircleRadioEmpty';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { IcMinusCircleFilled } from '@proton/icons/icons/IcMinusCircleFilled';
import { IcUpgrade } from '@proton/icons/icons/IcUpgrade';
import clsx from '@proton/utils/clsx';

import SkeletonLoader from '../../components/skeletonLoader/SkeletonLoader';

import './StatusBadge.scss';

export enum StatusBadgeStatus {
    On = 'on',
    Off = 'off',
    Warning = 'warning',
    Success = 'success',
    Upsell = 'upsell',
    Danger = 'danger',
}

interface StatusConfig {
    Icon: IconComponent;
    colorClassName: string;
}

const STATUS_CONFIG: Record<StatusBadgeStatus, StatusConfig> = {
    [StatusBadgeStatus.On]: { Icon: IcCheckmarkCircleFilled, colorClassName: 'status-badge--on' },
    [StatusBadgeStatus.Off]: { Icon: IcMinusCircleFilled, colorClassName: 'status-badge--off' },
    [StatusBadgeStatus.Warning]: { Icon: IcExclamationCircleFilled, colorClassName: 'status-badge--warning' },
    [StatusBadgeStatus.Success]: { Icon: IcCheckmarkCircleFilled, colorClassName: 'status-badge--success' },
    [StatusBadgeStatus.Upsell]: { Icon: IcUpgrade, colorClassName: 'status-badge--upsell' },
    [StatusBadgeStatus.Danger]: { Icon: IcExclamationCircleFilled, colorClassName: 'status-badge--danger' },
};

export interface StatusBadgeProps extends ComponentPropsWithoutRef<'span'> {
    status: StatusBadgeStatus;
    text?: string;
    icon?: IconComponent;
    loading?: boolean;
}

export const StatusBadge = ({ status, text, icon: IconOverride, className, loading, ...rest }: StatusBadgeProps) => {
    const { Icon: DefaultIcon, colorClassName } = STATUS_CONFIG[status];
    const Icon = loading ? IcCircleRadioEmpty : (IconOverride ?? DefaultIcon);

    return (
        <span
            className={clsx(
                'status-badge inline-flex flex-nowrap items-center gap-1 p-1 pr-2 rounded-full text-sm text-semibold',
                colorClassName,
                className
            )}
            {...rest}
        >
            <Icon className="status-badge-icon shrink-0" size={4} />
            {loading ? (
                <SkeletonLoader className="rounded-full" width={'3rem'} height={'0.75rem'} />
            ) : (
                <span className="status-badge-text lh100">{text}</span>
            )}
        </span>
    );
};
