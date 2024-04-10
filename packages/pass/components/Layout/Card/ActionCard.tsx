import type { FC, ReactNode } from 'react';

import { Button } from '@proton/atoms/Button';
import type { IconName } from '@proton/components/index';
import { Icon } from '@proton/components/index';
import { PillBadge } from '@proton/pass/components/Layout/Badge/PillBadge';
import { InfoCard } from '@proton/pass/components/Layout/Card/InfoCard';
import clsx from '@proton/utils/clsx';

export type SignalType = 'success' | 'warning' | 'danger' | 'info' | 'primary';

type Props = {
    disabled?: boolean;
    icon?: IconName;
    pillLabel?: ReactNode;
    subtitle: ReactNode;
    title: ReactNode;
    type?: SignalType;
    onClick?: () => void;
};

const getSignalTypeTheme = (type?: SignalType): string => {
    switch (type) {
        case 'warning':
            return 'ui-orange';
        case 'danger':
            return 'ui-danger';
        default:
            return 'ui-standard';
    }
};

export const ActionCard: FC<Props> = ({ disabled, title, subtitle, pillLabel, icon, type, onClick }) => {
    const renderIcon = () =>
        icon ? (
            <div className={clsx('flex items-center rounded-sm color-strong p-0.5', type && `bg-${type}`)}>
                <Icon name={icon} />
            </div>
        ) : null;

    return (
        <div className={clsx(getSignalTypeTheme(type), disabled && 'pointer-events-none')}>
            <Button
                shape="solid"
                fullWidth
                size="medium"
                className={clsx(
                    'border-norm flex justify-space-between flex-nowrap items-center rounded-lg button-fluid',
                    !onClick && 'pointer-events-none cursor-default',
                    !type && 'bg-weak'
                )}
                onClick={onClick}
            >
                <InfoCard
                    className="p-1"
                    icon={renderIcon}
                    title={title}
                    titleClassname="text-ellipsis color-norm text-semibold"
                    subtitle={subtitle}
                    subtitleClassname={`text-ellipsis color-${type ?? 'weak'}`}
                    actions={
                        <div className="flex shrink-0 gap-1">
                            {pillLabel && <PillBadge label={pillLabel} />}
                            {onClick && (
                                <Icon name="chevron-right" size={5} className={type ? 'color-strong' : 'color-weak'} />
                            )}
                        </div>
                    }
                />
            </Button>
        </div>
    );
};
