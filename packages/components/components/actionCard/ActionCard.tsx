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
            className="action-card text-left w100 flex flex-align-items-center flex-wrap-nowrap p1 rounded"
            disabled={disabled || loading}
            {...rest}
        >
            <div className="bg-strong rounded button-for-icon">
                <Icon name={iconName} />
            </div>
            <div className="mrauto">
                <div className="h6 lh100 m0 text-bold">{title}</div>
                {subtitle && <p className="color-weak m0">{subtitle}</p>}
            </div>
            {loading ? <Loader className="inline" /> : <Icon name="arrow-right" />}
        </button>
    );
};

export default ActionCard;
