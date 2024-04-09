import { Button } from '@proton/atoms/Button';
import clsx from '@proton/utils/clsx';

import ReadableDate from './ReadableDate';
import { getBreachIcon } from './helpers';

import './BreachListItem.scss';

interface Props {
    name: string | null;
    createdAt: string;
    handleClick?: () => void;
    disabled?: boolean;
    selected?: boolean;
    style: {
        iconAltText: string;
    };
    severity: number;
    exposedData:
        | null
        | {
              code: string;
              name: string;
          }[];
}

const BreachListItem = ({ name, createdAt, handleClick, disabled, selected, style, severity, exposedData }: Props) => {
    const { iconAltText } = style;

    const unReadBreach = false; // TODO: API needed?

    const breachIcon = getBreachIcon(severity);

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
                        <span className={clsx('block max-w-full text-ellipsis', unReadBreach && 'text-bold')}>
                            {name}
                        </span>
                        <ReadableDate
                            value={createdAt}
                            className={clsx(
                                'block max-w-full text-ellipsis m-0 text-sm color-weak',
                                unReadBreach && 'text-bold'
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
