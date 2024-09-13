import { Button } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import ReadableDate from './ReadableDate';
import { getBreachIcon } from './helpers';
import type { FetchedBreaches } from './models';

import './BreachListItem.scss';

interface Props {
    data: FetchedBreaches;
    handleClick?: () => void;
    disabled?: boolean;
    selected?: boolean;
    style: {
        iconAltText: string;
    };
    resolved?: boolean;
    unread?: boolean;
    hasMultipleAddresses?: boolean;
}

const BreachListItem = ({
    data,
    handleClick,
    disabled,
    selected,
    style,
    resolved = false,
    unread = false,
    hasMultipleAddresses,
}: Props) => {
    const { name, email, createdAt, severity, exposedData } = data;
    const { iconAltText } = style;

    const breachIcon = getBreachIcon(severity, { resolved });

    return (
        <li className="mb-1">
            <Button
                className={clsx(
                    'w-full px-4 py-3 border-none',
                    selected ? 'breach-list-item-selected' : '',
                    disabled ? 'pointer-events-none' : ''
                )}
                onClick={handleClick}
            >
                <span className="flex flex-nowrap items-start">
                    <span className="flex w-custom relative" style={{ '--w-custom': '1.875rem' }}>
                        <img src={breachIcon} className="m-auto w-full h-full" alt={iconAltText} />
                    </span>
                    <span className="flex-1 text-left pl-2 pr-1">
                        <span className={clsx('block max-w-full text-ellipsis', unread && 'text-bold')}>{name}</span>
                        {hasMultipleAddresses && (
                            <span
                                className={clsx(
                                    'block max-w-full text-ellipsis color-weak text-sm',
                                    unread && 'text-bold'
                                )}
                                title={email}
                            >
                                {email}
                            </span>
                        )}
                        <ReadableDate
                            value={createdAt}
                            className={clsx(
                                'block max-w-full text-ellipsis m-0 text-sm color-weak',
                                unread && 'text-bold'
                            )}
                        />
                        <div className="text-ellipsis mt-1">
                            {exposedData?.map((data) => {
                                return (
                                    <span className="pr-2 inline-block" key={`${data.code}${data.name}`}>
                                        <span className="text-sm rounded-full bg-norm border inline-block px-3 py-0.5">
                                            {data.name}
                                        </span>
                                    </span>
                                );
                            })}
                        </div>
                    </span>
                </span>
            </Button>
        </li>
    );
};

export default BreachListItem;
