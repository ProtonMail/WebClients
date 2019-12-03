import React from 'react';
import { Checkbox, DropdownMenu, DropdownMenuButton, Icon } from 'react-components';
import { c } from 'ttag';

import ToolbarDropdown from './ToolbarDropdown';

interface Props {
    loading?: boolean;
    disabled?: boolean;
    checked: boolean;
    onCheck: (checked?: boolean) => void;
}

const SelectAll = ({ loading, disabled, checked, onCheck }: Props) => {
    return (
        <>
            <Checkbox
                className="flex pl1"
                checked={checked}
                disabled={disabled}
                loading={loading}
                onChange={({ target }) => onCheck(target.checked)}
            />
            <ToolbarDropdown
                disabled={disabled}
                loading={loading}
                title={c('Title').t`Open actions dropdown`}
                content=""
            >
                {() => (
                    <DropdownMenu>
                        <DropdownMenuButton className="alignleft" onClick={() => onCheck()}>
                            <Icon name="show-all-emails" className="mr0-5" />
                            {c('Action').t`Select all`}
                        </DropdownMenuButton>
                        <DropdownMenuButton className="alignleft" onClick={() => onCheck()}>
                            <Icon name="unread" className="mr0-5" />
                            {c('Action').t`All unread`}
                        </DropdownMenuButton>
                        <DropdownMenuButton className="alignleft" onClick={() => onCheck()}>
                            <Icon name="read" className="mr0-5" />
                            {c('Action').t`All read`}
                        </DropdownMenuButton>
                        <DropdownMenuButton className="alignleft" onClick={() => onCheck()}>
                            <Icon name="star" className="mr0-5" />
                            {c('Action').t`All unstarred`}
                        </DropdownMenuButton>
                        <DropdownMenuButton className="alignleft" onClick={() => onCheck()}>
                            <Icon name="starfull" className="mr0-5" />
                            {c('Action').t`All starred`}
                        </DropdownMenuButton>
                    </DropdownMenu>
                )}
            </ToolbarDropdown>
        </>
    );
};

export default SelectAll;
