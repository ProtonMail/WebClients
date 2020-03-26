import React, { ReactNode } from 'react';
import { classnames, SidebarItem as CommonSidebarItem, Icon } from 'react-components';

interface Props {
    toggled: boolean;
    onToggle: () => void;
    text: ReactNode;
    editText?: string;
    onEdit?: () => void;
}

const SidebarGroupHeader = ({ toggled, onToggle, text, editText, onEdit }: Props) => {
    return (
        <CommonSidebarItem itemClassName="navigation__link--groupHeader">
            <div className="flex flex-nowrap">
                <button
                    className="uppercase flex-item-fluid alignleft navigation__link--groupHeader-link"
                    type="button"
                    onClick={onToggle}
                >
                    <span className="mr0-5 small">{text}</span>
                    <Icon name="caret" className={classnames(['navigation__icon--expand', toggled && 'rotateX-180'])} />
                </button>
                <button
                    className="navigation__link--groupHeader-link flex-item-noshrink"
                    title={editText}
                    type="button"
                    onClick={onEdit}
                >
                    <Icon name="settings-singular" className="navigation__icon" />
                    <span className="sr-only">{text}</span>
                </button>
            </div>
        </CommonSidebarItem>
    );
};

export default SidebarGroupHeader;
