import type { CSSProperties } from 'react';

import { useLoading } from '@proton/hooks/index';
import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import clsx from '@proton/utils/clsx';

import './CheckListItem.scss';

interface Props {
    icon: string;
    text: string | string[];
    onClick?: () => void | Promise<void>;
    style?: CSSProperties;
    disabled?: boolean;
    done: boolean;
    'data-testid'?: string;
}

const CheckListItem = ({ icon, text, onClick, style, done, disabled, 'data-testid': dataTestId }: Props) => {
    const [loading, withLoading] = useLoading();

    return (
        <button
            disabled={disabled || loading}
            onClick={async () => {
                await withLoading(async () => {
                    await onClick?.();
                });
            }}
            className={clsx(
                'flex flex-nowrap w-full items-center text-left checkList-item border-none',
                onClick !== undefined && !disabled ? 'cursor-pointer' : 'cursor-default',
                'p-0 text-sm color-norm p-2 mb-0.5 w-full',
                disabled && 'opacity-50'
            )}
            type="button"
            style={{
                ...style,
                color: 'var(--text-norm)',
            }}
            data-testid={dataTestId}
        >
            <img
                className={clsx('w-custom h-custom shrink-0', done && 'opacity-50')}
                src={icon}
                style={{
                    '--w-custom': '1.75rem',
                    '--h-custom': '1.5rem',
                }}
                alt=""
                data-testid={'checklist-item-icon-small'}
            />
            <span className={clsx('flex-1 px-2', done && 'opacity-50 text-strike')}>{text}</span>
            <div
                className={clsx(
                    'w-custom h-custom flex self-center',
                    done && 'flex items-center justify-center shrink-0'
                )}
                style={{
                    '--h-custom': done ? '1.5rem' : '1rem',
                    '--w-custom': done ? '1.5rem' : '1rem',
                }}
            >
                {done ? <IcCheckmarkCircle className="color-success" size={4} /> : <IcChevronRight size={4} />}
            </div>
        </button>
    );
};

export default CheckListItem;
