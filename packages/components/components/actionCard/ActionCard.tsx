import { ComponentPropsWithoutRef } from 'react';

import { Icon, IconName } from '../icon';
import { Loader } from '../loader';

interface ActionCardProps extends ComponentPropsWithoutRef<'button'> {
    onClick: () => void;
    iconName: IconName;
    title: string;
    subtitle?: string;
    loading?: boolean;
}

const ActionCard = ({ iconName, title, subtitle, loading, disabled, ...rest }: ActionCardProps) => {
    return (
        <button
            type="button"
            className="action-card text-left w-full flex items-center flex-wrap-nowrap p-4 rounded"
            disabled={disabled || loading}
            {...rest}
        >
            <div className="bg-strong rounded button-for-icon">
                <Icon name={iconName} />
            </div>
            <div className="mr-auto flex-item-fluid">
                <div className="h6 lh100 m-0 text-bold">{title}</div>
                {subtitle && <p className="color-weak m-0">{subtitle}</p>}
            </div>
            {loading ? <Loader className="inline flex-item-noshrink" /> : <Icon name="arrow-right" />}
        </button>
    );
};

export default ActionCard;
