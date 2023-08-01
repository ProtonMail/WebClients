import { CSSProperties } from 'react';

import Icon, { IconSize } from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import './CheckListItem.scss';

interface Props {
    largeIcon?: string; // TODO delete when cleaning the old checklist
    smallIcon?: string; // TODO delete when cleaning the old checklist
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
        let iconSize: IconSize = 16;

        if (done) {
            iconSize = smallVariant ? 12 : 20;
        }

        return iconSize;
    };

    return (
        <button
            disabled={disabled}
            onClick={() => onClick?.()}
            className={clsx(
                'flex flex-nowrap flex-align-items-center text-left checkList-item border-none w100',
                onClick !== undefined && !disabled ? 'cursor-pointer' : 'cursor-default',
                smallVariant ? 'p-0 text-sm color-norm p-2 mb-0.5 gap-2' : 'px-4 py-3 rounded-lg gap-3'
            )}
            style={{
                ...style,
                color: smallVariant ? 'var(--text-norm)' : 'var(--optional-promotion-text-color)',
            }}
            data-testid={dataTestId}
        >
            {largeIcon && smallIcon && (
                <img
                    className={clsx('w-custom h-custom flex-item-noshrink', done && 'opacity-50')}
                    src={smallVariant ? smallIcon : largeIcon}
                    style={{
                        '--w-custom': smallVariant ? '1.75rem' : '5.5rem',
                        '--h-custom': smallVariant ? '1.5rem' : '3rem',
                    }}
                    alt=""
                    data-testid={smallVariant ? 'checklist-item-icon-small' : 'checklist-item-icon-large'}
                />
            )}
            <span className={clsx('flex-item-fluid px-2', done && 'opacity-50')}>{text}</span>
            <div
                className={clsx(
                    'w-custom h-custom flex flex-align-self-center',
                    done && 'bg-primary rounded-50 flex flex-align-items-center flex-justify-center flex-item-noshrink'
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
