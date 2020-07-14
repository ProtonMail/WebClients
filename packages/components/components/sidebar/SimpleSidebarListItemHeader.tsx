import React from 'react';
import { classnames, Icon } from '../../index';
import SidebarListItem from './SidebarListItem';

interface Props {
    toggle: boolean;
    onToggle: () => void;
    hasCaret?: boolean;
    right?: React.ReactNode;
    text: string;
    title?: string;
}
const SimpleSidebarListItemHeader = ({ toggle, onToggle, hasCaret = true, right, text, title }: Props) => {
    return (
        <SidebarListItem className="navigation__link--groupHeader">
            <div className="flex flex-nowrap">
                <button
                    className="uppercase flex-item-fluid alignleft navigation__link--groupHeader-link"
                    type="button"
                    onClick={onToggle}
                    title={title}
                >
                    <span className="mr0-5 small">{text}</span>
                    {hasCaret && (
                        <Icon
                            name="caret"
                            className={classnames(['navigation__icon--expand', toggle && 'rotateX-180'])}
                        />
                    )}
                </button>
                {right}
            </div>
        </SidebarListItem>
    );
};

export default SimpleSidebarListItemHeader;
