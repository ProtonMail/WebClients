import React from 'react';
import { c } from 'ttag';
import {
    usePopperAnchor,
    Dropdown,
    DropdownMenu,
    Icon,
    DropdownMenuButton,
    ToolbarButton,
    DropdownCaret,
} from 'react-components';
import { useFileBrowserLayout } from '../../FileBrowser/FileBrowserLayoutProvider';

interface Props {
    layoutId?: string;
}

const LayoutDropdown = ({ layoutId }: Props) => {
    const { changeView, view } = useFileBrowserLayout(layoutId);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const id = `dropdown-layout-${layoutId}`;
    const buttonIcon = view === 'grid' ? 'layout-columns' : 'layout-rows';

    return (
        <>
            <ToolbarButton
                aria-describedby={id}
                ref={anchorRef}
                aria-expanded={isOpen}
                onClick={toggle}
                icon={buttonIcon}
                data-testid="toolbar-layout"
                title={c('Title').t`Change layout`}
            >
                <DropdownCaret isOpen={isOpen} className="expand-caret toolbar-icon mtauto mbauto" />
            </ToolbarButton>
            <Dropdown id={id} isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom">
                <DropdownMenu>
                    <DropdownMenuButton
                        className="flex flex-nowrap alignleft"
                        onClick={() => changeView('list', layoutId)}
                    >
                        <Icon className="mt0-25 mr0-5" name="layout-rows" />
                        {c('Action').t`List layout`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="flex flex-nowrap alignleft"
                        onClick={() => changeView('grid', layoutId)}
                    >
                        <Icon className="mt0-25 mr0-5" name="layout-columns" />
                        {c('Action').t`Grid layout`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default LayoutDropdown;
