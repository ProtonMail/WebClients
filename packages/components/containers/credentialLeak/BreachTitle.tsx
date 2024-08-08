import clsx from '@proton/utils/clsx';

import ReadableDate from './ReadableDate';
import { getBreachIcon } from './helpers';

interface BreachTitleProps {
    name: string;
    createdAt: string;
    style: {
        iconAltText: string;
    };
    className?: string;
    inModal?: boolean;
    severity: number;
    resolved: boolean;
}

const BreachTitle = ({ name, createdAt, style, className, inModal = false, severity, resolved }: BreachTitleProps) => {
    const { iconAltText } = style;

    const breachIcon = getBreachIcon(severity, { resolved });

    return (
        <span className={clsx('flex flex-nowrap items-start', className)}>
            <span className={clsx('ratio-square rounded flex w-custom relative')} style={{ '--w-custom': '3rem' }}>
                <img src={breachIcon} className="m-auto w-full h-full" alt={iconAltText} />
            </span>
            <span className="flex-1 text-left pl-2 pr-1">
                {inModal ? (
                    <div className="inline-flex items-center">
                        <span className="block text- mr-1">{name}</span>
                    </div>
                ) : (
                    <div className="flex flex-nowrap items-center">
                        <h3 className="block text-bold">{name}</h3>
                    </div>
                )}
                <ReadableDate
                    value={createdAt}
                    className={clsx('block m-0 color-weak text-normal', inModal ? 'text-xs' : 'text-sm')}
                    dateInBold
                    displayInfoText
                />
            </span>
        </span>
    );
};

export default BreachTitle;
