import { ComponentPropsWithoutRef, ReactNode } from 'react';
import clsx from '@proton/utils/clsx';

export interface VerticalStepProps extends ComponentPropsWithoutRef<'li'> {
    description?: ReactNode;
    icon: ReactNode;
    /**
     * 'next': default state
     * 'done': icon will be colored as success
     * 'passed': icon will be colored as success, text will look like disabled, and green will be applied to the "path" to the next icon
     */
    status?: 'next' | 'done' | 'passed';
}

const VerticalStep = ({ title, description, icon, status = 'next', className, ...rest }: VerticalStepProps) => {
    return (
        <li
            {...rest}
            className={clsx(
                'flex flex-nowrap flex-align-items-start vertical-steps-item',
                status === 'passed' && 'vertical-steps-item--next-done',
                className
            )}
        >
            <div
                className={clsx(
                    'flex-item-noshrink rounded-50 vertical-steps-icon-container flex',
                    ['done', 'passed'].includes(status) ? 'bg-success' : 'bg-strong'
                )}
            >
                {icon}
            </div>
            <div
                className={clsx(
                    'flex-item-fluid pl0-5 flex flex-column flex-nowrap relative vertical-steps-item-text',
                    status === 'passed' && 'color-disabled'
                )}
            >
                {title ? <span className={clsx([status !== 'passed' && 'text-semibold'])}>{title}</span> : null}
                {description ? (
                    <span className={clsx(['text-sm', status !== 'passed' && 'color-weak'])}>{description}</span>
                ) : null}
            </div>
        </li>
    );
};

export default VerticalStep;
