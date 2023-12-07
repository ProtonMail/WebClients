import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './QuickSettingsSectionRow.scss';

interface Props {
    label: string;
    labelInfo?: ReactNode;
    action: ReactNode;
    ellipsisOnText?: boolean;
}

const QuickSettingsSectionRow = ({ label, labelInfo, action, ellipsisOnText = true }: Props) => {
    return (
        <label className="quickSettingsSectionRow flex flex-nowrap justify-space-between items-center gap-2 w-full">
            <span className="flex items-center gap-2">
                <span className={clsx('flex-1 text-left', ellipsisOnText && 'text-ellipsis')}>{label}</span>
                {labelInfo}
            </span>
            <span className="quickSettingsSectionRow-action shrink-0">{action}</span>
        </label>
    );
};

export default QuickSettingsSectionRow;
