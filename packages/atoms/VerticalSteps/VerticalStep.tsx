import { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Icon, IconName } from '@proton/components/components';

import clsx from '../clsx';

export interface VerticalStepProps extends ComponentPropsWithoutRef<'li'> {
    description?: ReactNode;
    icon: IconName;
    /** 
     * define `alt` only for non decorative icons
     * if the icon does not bring any added value to the text, leave it empty
     */
    alt?: string;
    /**
     * 'next': default state
     * 'done': icon will be colored as success 
     * 'passed': icon will be colored as success, text will look like disabled, and green will be applied to the "path" to the next icon
     */
    status?: 'next' | 'done' | 'passed';
}

const VerticalStep = ({ title, description, icon, alt, status = 'next', className, ...rest }: VerticalStepProps) => {
    return (
        <li
            {...rest}
            className={clsx([
                'flex flex-nowrap flex-align-items-start vertical-steps-item',
                status === 'passed' && 'vertical-steps-item--next-done',
                className,
            ])}
        >
            <span
                className={clsx([
                    'flex-item-noshrink rounded-50 vertical-steps-icon-container flex',
                    ['done', 'passed'].includes(status) ? 'bg-success' : 'bg-strong',
                ])}
            >
                <Icon name={icon} className="mauto" size={16} alt={alt} />
            </span>
            <span
                className={clsx([
                    'flex-item-fluid pl0-5 flex flex-column flex-nowrap relative vertical-steps-item-text',
                    status === 'passed' && 'color-disabled',
                ])}
            >
                {title ? <span className={clsx([status !== 'passed' && 'text-semibold'])}>{title}</span> : null}
                {description ? (
                    <span className={clsx(['text-sm', status !== 'passed' && 'color-weak'])}>{description}</span>
                ) : null}
            </span>
        </li>
    );
};

export default VerticalStep;
