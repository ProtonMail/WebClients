import type { ComponentPropsWithRef, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './QuickSettingsSectionRow.scss';

interface Props {
    label: string;
    labelProps?: ComponentPropsWithRef<'label'>;
    labelInfo?: ReactNode;
    action: ReactNode;
    ellipsisOnText?: boolean;
}

const QuickSettingsSectionRow = ({ label, labelProps, labelInfo, action, ellipsisOnText = true }: Props) => {
    return (
        <label
            className="quickSettingsSectionRow flex flex-nowrap justify-space-between items-center gap-2 w-full"
            {...labelProps}
        >
            <span className="flex items-center gap-2">
                <span className={clsx('flex-1 text-left', ellipsisOnText && 'text-ellipsis')}>{label}</span>
                {labelInfo}
            </span>
            <span className="quickSettingsSectionRow-action shrink-0">{action}</span>
        </label>
    );
};

export default QuickSettingsSectionRow;
