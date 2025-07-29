import { Button } from '@proton/atoms';
import { IcChevronRight } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import './CardButton.scss';

interface CardButtonProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    circleColor: string;
    iconColor: string;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
}

export const CardButton = ({
    title,
    description,
    icon,
    circleColor,
    iconColor,
    className,
    onClick,
    disabled = false,
}: CardButtonProps) => {
    return (
        <Button
            className={clsx('card-button border flex flex-nowrap items-center gap-6 p-8', className)}
            onClick={onClick}
            disabled={disabled}
        >
            <div
                className="w-custom h-custom rounded-full flex items-center justify-center shrink-0"
                style={{ '--w-custom': '3rem', '--h-custom': '3rem', backgroundColor: circleColor, color: iconColor }}
            >
                {icon}
            </div>
            <div className="flex flex-column gap-2 text-left">
                <div className="text-lg color-norm text-semibold">{title}</div>
                <div className="color-weak">{description}</div>
            </div>
            <div className="ml-4">
                <IcChevronRight size={5} />
            </div>
        </Button>
    );
};
