import { memo } from 'react';

import { c } from 'ttag';

import { Label } from '@proton/shared/lib/interfaces/Label';

import { UnreadCounts } from './MailSidebarList';
import SidebarItem from './SidebarItem';

interface Props {
    currentLabelID: string;
    counterMap: UnreadCounts;
    labels: Label[];
    updateFocusItem: (item: string) => void;
}

const SidebarLabels = ({ currentLabelID, counterMap, labels, updateFocusItem }: Props) => {
    const emptyLabels = labels.length === 0;

    return emptyLabels ? (
        <div className="py0-75 ml2 text-sm color-weak">{c('Description').t`No labels`}</div>
    ) : (
        <>
            {labels.map((label) => (
                <SidebarItem
                    key={label.ID}
                    currentLabelID={currentLabelID}
                    labelID={label.ID}
                    icon="circle-filled"
                    iconSize={16}
                    text={label.Name}
                    color={label.Color}
                    isFolder={false}
                    unreadCount={counterMap[label.ID]}
                    unreadWeak={true}
                    id={label.ID}
                    onFocus={updateFocusItem}
                />
            ))}
        </>
    );
};

export default memo(SidebarLabels);
