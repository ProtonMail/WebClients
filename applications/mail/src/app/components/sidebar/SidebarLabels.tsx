import React, { memo } from 'react';

import { Label } from 'proton-shared/lib/interfaces/Label';

import SidebarItem from './SidebarItem';
import EmptyLabels from './EmptyLabels';
import { UnreadCounts } from './MailSidebarList';

interface Props {
    currentLabelID: string;
    counterMap: UnreadCounts;
    labels: Label[];
    updateFocusItem: (item: string) => void;
}

const SidebarLabels = ({ currentLabelID, counterMap, labels, updateFocusItem }: Props) => {
    return (
        <>
            {labels.length ? (
                labels.map((label) => (
                    <SidebarItem
                        key={label.ID}
                        currentLabelID={currentLabelID}
                        labelID={label.ID}
                        icon="circle"
                        iconSize={12}
                        text={label.Name}
                        color={label.Color}
                        isFolder={false}
                        unreadCount={counterMap[label.ID]}
                        id={label.ID}
                        onFocus={() => updateFocusItem(label.ID)}
                    />
                ))
            ) : (
                <EmptyLabels onFocus={() => updateFocusItem('add-label')} />
            )}
        </>
    );
};

export default memo(SidebarLabels);
