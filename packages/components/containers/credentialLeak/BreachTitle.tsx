import { Icon } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import ReadableDate from './ReadableDate';

interface BreachTitleProps {
    name: string;
    createdAt: string;
    style: {
        backgroundClass: string;
        colorClass: string;
        iconAltText: string;
    };
    className?: string;
}

const BreachTitle = ({ name, createdAt, style, className }: BreachTitleProps) => {
    const { backgroundClass, colorClass, iconAltText } = style;

    return (
        <span className={clsx('flex flex-nowrap items-start', className)}>
            <span
                className={clsx('ratio-square rounded flex w-custom', backgroundClass)}
                style={{ '--w-custom': '3rem' }}
            >
                <Icon name="bolt" size={7} className={clsx('m-auto', colorClass)} alt={iconAltText} />
            </span>
            <span className="flex-1 text-left pl-2 pr-1">
                <h3 className="block text-bold">{name}</h3>
                <ReadableDate value={createdAt} className="block m-0 text-sm color-weak" />
            </span>
        </span>
    );
};

export default BreachTitle;
