import { memo, useState } from 'react';

import { c } from 'ttag';

import type { Label } from '@proton/shared/lib/interfaces/Label';

import type { MoveParams } from 'proton-mail/hooks/actions/applyLocation/interface';
import { useMailboxCounter } from 'proton-mail/hooks/mailboxCounter/useMailboxCounter';

import type { ApplyLabelsParams } from '../../hooks/actions/label/interface';
import SidebarItem from './SidebarItem';
import SidebarLabelActions from './SidebarLabelActions';

interface LabelProps {
    label: Label;
    unreadCount: number;
    updateFocusItem: (item: string) => void;
    moveToFolder: (params: MoveParams) => void;
    applyLabels: (params: ApplyLabelsParams) => void;
}

const SidebarLabel = ({ label, unreadCount, updateFocusItem, moveToFolder, applyLabels }: LabelProps) => {
    const [isOptionDropdownOpened, setIsOptionDropdownOpened] = useState(false);

    return (
        <SidebarItem
            labelID={label.ID}
            isOptionDropdownOpened={isOptionDropdownOpened}
            icon="circle-filled"
            iconSize={4}
            text={label.Name}
            color={label.Color}
            isFolder={false}
            isLabel={true}
            unreadCount={unreadCount}
            id={label.ID}
            onFocus={updateFocusItem}
            moveToFolder={moveToFolder}
            applyLabels={applyLabels}
            className="navigation-item--label"
            itemOptions={
                <SidebarLabelActions type={'label'} element={label} onToggleDropdown={setIsOptionDropdownOpened} />
            }
        />
    );
};

interface LabelsProps {
    labels: Label[];
    updateFocusItem: (item: string) => void;
    moveToFolder: (params: MoveParams) => void;
    applyLabels: (params: ApplyLabelsParams) => void;
}

const SidebarLabels = ({ labels, updateFocusItem, moveToFolder, applyLabels }: LabelsProps) => {
    const { getLocationCount } = useMailboxCounter();

    return labels.length === 0 ? (
        <div className="py-2 ml-7 text-sm color-weak">{c('Description').t`No labels`}</div>
    ) : (
        <>
            {labels.map((label) => (
                <SidebarLabel
                    key={label.ID}
                    label={label}
                    unreadCount={getLocationCount(label.ID).Unread}
                    updateFocusItem={updateFocusItem}
                    moveToFolder={moveToFolder}
                    applyLabels={applyLabels}
                />
            ))}
        </>
    );
};

export default memo(SidebarLabels);
