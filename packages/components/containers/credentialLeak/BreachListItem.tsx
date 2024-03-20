import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import ReadableDate from './ReadableDate';

import './BreachListItem.scss';

interface Props {
    name: string | null;
    createdAt: string;
    handleClick?: () => void;
    disabled?: boolean;
    selected?: boolean;
    style: {
        backgroundClass: string;
        colorClass: string;
        iconAltText: string;
    };
}

const BreachListItem = ({ name, createdAt, handleClick, disabled, selected, style }: Props) => {
    const { colorClass, backgroundClass, iconAltText } = style;

    return (
        <li>
            <Button
                className={clsx(
                    'w-full px-4 py-3 border-none',
                    selected ? 'breach-list-item-selected' : '',
                    disabled ? 'pointer-events-none' : ''
                )}
                onClick={handleClick}
            >
                <span className="flex flex-nowrap items-start">
                    <span
                        className={clsx('ratio-square rounded flex w-custom', backgroundClass)}
                        style={{ '--w-custom': '48px' }}
                    >
                        <Icon name="bolt" size={6} className={clsx('m-auto', colorClass)} alt={iconAltText} />
                    </span>
                    <span className="flex-1 text-left pl-2 pr-1">
                        <span className="block max-w-full text-ellipsis">{name}</span>
                        <ReadableDate
                            value={createdAt}
                            className="block max-w-full text-ellipsis m-0 text-sm color-weak"
                        />
                    </span>
                </span>
            </Button>
        </li>
    );
};

export default BreachListItem;
