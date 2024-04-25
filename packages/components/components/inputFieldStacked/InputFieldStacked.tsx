import clsx from '@proton/utils/clsx';

import { Icon, IconName } from '../icon';

import './InputFieldStacked.scss';

const InputFieldStacked = ({
    children,
    icon,
    hasError,
    isBigger,
    isGroupElement,
    classname,
}: {
    children: React.ReactNode;
    icon?: IconName;
    hasError?: boolean;
    isBigger?: boolean;
    isGroupElement?: boolean;
    classname?: string;
}) => (
    <div
        className={clsx(
            'relative stacked-field border-weak px-4 py-3 flex items-center gap-x-4',
            hasError && 'stacked-field--errors',
            isBigger && 'stacked-field--bigger-field',
            isGroupElement ? 'border-top border-left border-right' : 'border rounded-lg',
            classname
        )}
    >
        {icon && <Icon name={icon} className="shrink-0" />}
        <div className="flex-1">{children}</div>
    </div>
);

export default InputFieldStacked;
