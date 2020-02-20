import React from 'react';
import { DropdownMenu, DropdownMenuButton } from 'react-components';
import EditorToolbarDropdown from './EditorToolbarDropdown';

const EditorToolbarMoreDropdown = () => {
    return (
        <EditorToolbarDropdown content="...">
            <DropdownMenu>
                <DropdownMenuButton>TODO</DropdownMenuButton>
                <DropdownMenuButton>TODO</DropdownMenuButton>
                <DropdownMenuButton>TODO</DropdownMenuButton>
                <DropdownMenuButton>TODO</DropdownMenuButton>
            </DropdownMenu>
        </EditorToolbarDropdown>
    );
};

export default EditorToolbarMoreDropdown;
