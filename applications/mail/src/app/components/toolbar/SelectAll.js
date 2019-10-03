import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox, DropdownMenu, DropdownMenuButton, Icon } from 'react-components';
import { c } from 'ttag';

import ToolbarDropdown from './ToolbarDropdown';

const SelectAll = ({ loading, disabled, checked, onCheck }) => {
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
                originalPlacement="bottom"
                disabled={disabled}
                loading={loading}
                title={c('Title').t`Open actions dropdown`}
                content=""
            >
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
            </ToolbarDropdown>
        </>
    );
};

SelectAll.propTypes = {
    loading: PropTypes.bool,
    disabled: PropTypes.bool,
    checked: PropTypes.bool.isRequired,
    onCheck: PropTypes.func.isRequired
};

export default SelectAll;
