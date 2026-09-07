import type { ComponentPropsWithoutRef, ReactElement } from 'react';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { IcArrowRight } from '@proton/icons/icons/IcArrowRight';

import Loader from '../loader/Loader';

interface ActionCardProps extends ComponentPropsWithoutRef<'button'> {
    onClick: () => void;
    icon: ReactElement;
    title: string;
    subtitle?: string;
    loading?: boolean;
}

const ActionCard = ({ icon, title, subtitle, loading, disabled, ...rest }: ActionCardProps) => {
    return (
        <button
            type="button"
            className="action-card text-left w-full flex items-center flex-nowrap p-4 rounded"
            disabled={disabled || loading}
            {...rest}
        >
            <ButtonLike as="div" shape="solid" icon className="shrink-0 bg-strong pointer-events-none">
                {icon}
            </ButtonLike>
            <div className="mr-auto flex-1">
                <div className="h6 lh100 m-0 text-bold">{title}</div>
                {subtitle && <p className="color-weak m-0">{subtitle}</p>}
            </div>
            {loading ? <Loader className="inline shrink-0" /> : <IcArrowRight />}
        </button>
    );
};

export default ActionCard;
