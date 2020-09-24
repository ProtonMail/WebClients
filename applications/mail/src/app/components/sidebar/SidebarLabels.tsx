import React, { memo } from 'react';

import { useLabels } from 'react-components';

import SidebarItem from './SidebarItem';
import EmptyLabels from './EmptyLabels';
import { UnreadCounts } from './MailSidebarList';

interface Props {
    currentLabelID: string;
    counterMap: UnreadCounts;
}

const SidebarLabels = ({ currentLabelID, counterMap }: Props) => {
    const [labels = []] = useLabels();

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
                    />
                ))
            ) : (
                <EmptyLabels />
            )}
        </>
    );
};

export default memo(SidebarLabels);
