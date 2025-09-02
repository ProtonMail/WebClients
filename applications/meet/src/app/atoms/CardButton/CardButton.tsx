import { Button } from '@proton/atoms';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
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
            className={clsx(
                'card-button border flex flex-nowrap items-center gap-4 md:gap-2 lg:gap-4 xl:gap-6 p-4 md:p-2 lg:p-4 xl:p-6 w-full md:w-auto',
                className
            )}
            onClick={onClick}
            disabled={disabled}
        >
            <div
                className="w-custom h-custom rounded-full flex items-center justify-center shrink-0"
                style={{ '--w-custom': '3rem', '--h-custom': '3rem', backgroundColor: circleColor, color: iconColor }}
            >
                {icon}
            </div>
            <div className="flex flex-column gap-2 text-left flex-1">
                <div className="md:text-sm lg:text-rg xl:text-lg color-norm text-semibold text-ellipsis">{title}</div>
                <div className="color-weak hidden md:block md:text-xs lg:text-rg">{description}</div>
            </div>
            <div className="ml-4 shrink-0">
                <IcChevronRight size={5} />
            </div>
        </Button>
    );
};
