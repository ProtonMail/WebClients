import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import './BusinessPlanIcon.scss';

interface Props<P extends string> {
    icon: ReactNode;
    plan: P;
    selected: boolean;
    handleClick: (plan: P) => void;
    title: string;
}

export const BusinessPlanIcon = <P extends string>({ icon, plan, selected, handleClick, title }: Props<P>) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    // The tabs scroll horizontally on narrow screens, so keep the selected one visible
    useEffect(() => {
        if (selected) {
            buttonRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
        }
    }, [selected]);

    return (
        <button
            ref={buttonRef}
            className={clsx(
                'BusinessPlanIcon fade-in w-custom sm:w-custom shrink-0 sm:p-2 text-center outline-none--at-all',
                selected && 'BusinessPlanIcon--selected'
            )}
            style={{ '--w-custom': '6.5rem', '--sm-w-custom': '8rem' }}
            onClick={() => handleClick(plan)}
            title={title}
            aria-label={c('Signup').t`Select ${title}`}
        >
            <div
                className={clsx(
                    'BusinessPlanIcon-icon overflow-hidden w-custom sm:w-custom flex items-center justify-center ratio-square shadow-color-primary mx-auto mb-3',
                    selected ? 'shadow-lifted' : 'shadow-raised'
                )}
                style={{ '--w-custom': '2.5rem', '--sm-w-custom': '3rem' }}
            >
                {icon}
            </div>
            <div
                className={clsx(
                    'BusinessPlanIcon-name text-sm text-semibold lg:text-rg inline-block rounded-xl px-2 sm:px-3 py-2 text-no-cut text-nowrap',
                    selected ? 'color-primary bg-norm shadow-lifted shadow-color-primary' : 'color-weak'
                )}
            >
                <span>{title}</span>
            </div>
        </button>
    );
};
