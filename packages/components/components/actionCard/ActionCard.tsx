import { ComponentPropsWithoutRef } from 'react';

import { ButtonLike } from '@proton/atoms/Button';

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
            className="action-card text-left w-full flex items-center flex-nowrap p-4 rounded"
            disabled={disabled || loading}
            {...rest}
        >
            <ButtonLike as="div" shape="solid" icon className="shrink-0 bg-strong no-pointer-events">
                <Icon name={iconName} />
            </ButtonLike>
            <div className="mr-auto flex-1">
                <div className="h6 lh100 m-0 text-bold">{title}</div>
                {subtitle && <p className="color-weak m-0">{subtitle}</p>}
            </div>
            {loading ? <Loader className="inline shrink-0" /> : <Icon name="arrow-right" />}
        </button>
    );
};

export default ActionCard;
