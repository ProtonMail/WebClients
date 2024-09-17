import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

export interface VerticalStepProps extends ComponentPropsWithoutRef<'li'> {
    description?: ReactNode;
    titleCentered?: Boolean;
    titleBold?: Boolean;
    icon: ReactNode;
    /**
     * 'next': default state
     * 'done': icon will be colored as success
     * 'passed': icon will be colored as success, text will look like disabled, and green will be applied to the "path" to the next icon
     */
    status?: 'next' | 'done' | 'passed';
}

const VerticalStep = ({
    title,
    titleCentered = false,
    titleBold = true,
    description,
    icon,
    status = 'next',
    className,
    ...rest
}: VerticalStepProps) => {
    return (
        <li
            {...rest}
            className={clsx(
                'flex flex-nowrap items-start vertical-steps-item',
                status === 'passed' && 'vertical-steps-item--next-done',
                className
            )}
        >
            <div
                className={clsx(
                    'shrink-0 rounded-50 vertical-steps-icon-container flex',
                    ['done', 'passed'].includes(status) ? 'bg-success' : 'bg-strong'
                )}
            >
                {icon}
            </div>
            <div
                className={clsx(
                    'flex-1 pl-2 flex flex-column flex-nowrap relative vertical-steps-item-text',
                    status === 'passed' && 'color-disabled',
                    titleCentered && 'my-auto'
                )}
            >
                {title ? (
                    <span className={clsx([status !== 'passed' && titleBold && 'text-semibold'])}>{title}</span>
                ) : null}
                {description ? (
                    <span className={clsx(['text-sm', status !== 'passed' && 'color-weak'])}>{description}</span>
                ) : null}
            </div>
        </li>
    );
};

export default VerticalStep;
