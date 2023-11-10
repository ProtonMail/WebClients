import React from 'react';

import { c } from 'ttag';

import SidebarListItemContent from './SidebarListItemContent';
import SidebarListItemContentIcon from './SidebarListItemContentIcon';

interface Props {
    onClick: () => void;
}

const SidebarContactItem = ({ onClick }: Props) => {
    return (
        <div className="navigation-item h-auto flex-item-noshrink px-3 mb-4 mt-2 md:hidden">
            <button type="button" onClick={onClick} className="navigation-link">
                <SidebarListItemContent left={<SidebarListItemContentIcon name="users" />}>
                    <span>{c('Header').t`Contacts`}</span>
                </SidebarListItemContent>
            </button>
        </div>
    );
};

export default SidebarContactItem;
