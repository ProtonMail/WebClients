import { forwardRef } from 'react';

import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import './InputFieldStacked.scss';

interface InputFieldStackedProps {
    children: React.ReactNode;
    icon?: IconName | React.ReactNode;
    suffix?: React.ReactNode;
    hasError?: boolean;
    isBigger?: boolean;
    isGroupElement?: boolean;
    classname?: string;
}

const InputFieldStacked = forwardRef<HTMLDivElement, InputFieldStackedProps>(
    ({ children, icon, suffix, hasError, isBigger, isGroupElement, classname }, ref) => (
        <div
            ref={ref}
            className={clsx(
                'relative stacked-field flex items-center gap-x-4 w-full',
                hasError && 'stacked-field--errors',
                isBigger && 'stacked-field--bigger-field',
                isGroupElement ? 'border-top border-left border-right' : 'border stacked-field--rounded',
                classname
            )}
        >
            {icon &&
                (typeof icon === 'string' ? (
                    <Icon name={icon as IconName} className="shrink-0" />
                ) : (
                    <div className="shrink-0">{icon}</div>
                ))}
            <div className="flex-1">{children}</div>
            {suffix && <div className="shrink-0">{suffix}</div>}
        </div>
    )
);

InputFieldStacked.displayName = 'InputFieldStacked';

export default InputFieldStacked;
