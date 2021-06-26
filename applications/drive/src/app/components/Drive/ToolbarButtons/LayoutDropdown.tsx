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
import useUserSettings from '../../../hooks/drive/useUserSettings';
import { LayoutSetting } from '../../../interfaces/userSettings';

const LayoutDropdown = () => {
    const { layout, changeLayout } = useUserSettings();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const id = `dropdown-layout`;

    return (
        <>
            <ToolbarButton
                aria-describedby={id}
                ref={anchorRef}
                aria-expanded={isOpen}
                onClick={toggle}
                icon={<Icon name={layout === LayoutSetting.Grid ? 'layout-columns' : 'layout-rows'} />}
                data-testid="toolbar-layout"
                title={c('Title').t`Change layout`}
            >
                <DropdownCaret isOpen={isOpen} className="expand-caret toolbar-icon mtauto mbauto" />
            </ToolbarButton>
            <Dropdown id={id} isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom">
                <DropdownMenu>
                    <DropdownMenuButton
                        className="flex flex-nowrap text-left"
                        aria-current={layout === LayoutSetting.List}
                        onClick={() => changeLayout(LayoutSetting.List)}
                    >
                        <Icon className="mt0-25 mr0-5" name="layout-rows" />
                        {c('Action').t`List layout`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="flex flex-nowrap text-left"
                        aria-current={layout === LayoutSetting.Grid}
                        onClick={() => changeLayout(LayoutSetting.Grid)}
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
