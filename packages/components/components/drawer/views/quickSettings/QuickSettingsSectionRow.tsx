import { ReactNode } from 'react';

import './QuickSettingsSectionRow.scss';

interface Props {
    label: string;
    labelInfo?: ReactNode;
    action: ReactNode;
}

const QuickSettingsSectionRow = ({ label, labelInfo, action }: Props) => {
    return (
        <label className="quickSettingsSectionRow flex flex-nowrap justify-space-between items-center gap-2 w-full">
            <span className="flex items-center gap-2">
                <span className="flex-item-fluid text-left text-ellipsis">{label}</span>
                {labelInfo}
            </span>
            <span className="quickSettingsSectionRow-action flex-item-noshrink">{action}</span>
        </label>
    );
};

export default QuickSettingsSectionRow;
