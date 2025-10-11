import type { CSSProperties } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import type { IconSize } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

import './CheckListItem.scss';

interface Props {
    largeIcon: string;
    smallIcon: string;
    text: string | string[];
    onClick?: () => void;
    smallVariant: boolean;
    style?: CSSProperties;
    disabled?: boolean;
    done: boolean;
    'data-testid'?: string;
}

const CheckListItem = ({
    largeIcon,
    smallIcon,
    text,
    onClick,
    smallVariant,
    style,
    done,
    disabled,
    'data-testid': dataTestId,
}: Props) => {
    const getIconSize = () => {
        let iconSize: IconSize = 4;

        if (done) {
            iconSize = smallVariant ? 3 : 5;
        }

        return iconSize;
    };

    return (
        <button
            disabled={disabled}
            onClick={() => onClick?.()}
            className={clsx(
                'flex flex-nowrap w-full items-center text-left checkList-item border-none',
                onClick !== undefined && !disabled ? 'cursor-pointer' : 'cursor-default',
                smallVariant ? 'p-0 text-sm color-norm p-2 mb-0.5 w-full' : 'px-4 py-3 rounded-lg gap-3',
                disabled && 'opacity-50'
            )}
            type="button"
            style={{
                ...style,
                color: smallVariant ? 'var(--text-norm)' : 'var(--optional-promotion-text-color)',
            }}
            data-testid={dataTestId}
        >
            <img
                className={clsx('w-custom h-custom shrink-0', done && 'opacity-50')}
                src={smallVariant ? smallIcon : largeIcon}
                style={{
                    '--w-custom': smallVariant ? '1.75rem' : '5.5rem',
                    '--h-custom': smallVariant ? '1.5rem' : '3rem',
                }}
                alt=""
                data-testid={smallVariant ? 'checklist-item-icon-small' : 'checklist-item-icon-large'}
            />
            <span className={clsx('flex-1 px-2', done && 'opacity-50')}>{text}</span>
            <div
                className={clsx(
                    'w-custom h-custom flex self-center',
                    done && 'bg-primary rounded-50 flex items-center justify-center shrink-0'
                )}
                style={{
                    '--h-custom': smallVariant || !done ? '1rem' : '1.5rem',
                    '--w-custom': smallVariant || !done ? '1rem' : '1.5rem',
                }}
            >
                <Icon name={done ? 'checkmark' : 'chevron-right'} size={getIconSize()} />
            </div>
        </button>
    );
};

export default CheckListItem;
