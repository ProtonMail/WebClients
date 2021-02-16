import React from 'react';
import { Checkbox, DropdownMenu, DropdownMenuButton, Icon, Tooltip } from 'react-components';
import { c } from 'ttag';

import ToolbarDropdown from './ToolbarDropdown';
import { isUnread, isStarred } from '../../helpers/elements';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElementsCache';

interface Props {
    labelID: string;
    loading?: boolean;
    disabled?: boolean;
    elementIDs: string[];
    selectedIDs: string[];
    onCheck: (IDs: string[], checked: boolean, replace: boolean) => void;
}

const SelectAll = ({ labelID, loading, disabled, elementIDs, selectedIDs, onCheck }: Props) => {
    const getElementsFromIDs = useGetElementsFromIDs();

    const checked = elementIDs.length ? elementIDs.length === selectedIDs.length : false;

    const handleAll = (checked: boolean) => () => onCheck(elementIDs, checked, true);

    const handleRead = (read: boolean) => () =>
        onCheck(
            getElementsFromIDs(elementIDs)
                .filter((element) => read === !isUnread(element, labelID))
                .map(({ ID = '' }) => ID),
            true,
            true
        );

    const handleStarred = (starred: boolean) => () =>
        onCheck(
            getElementsFromIDs(elementIDs)
                .filter((element) => starred === isStarred(element))
                .map(({ ID = '' }) => ID),
            true,
            true
        );

    return (
        <>
            <Tooltip
                className="flex ml0-5 pl1"
                title={checked ? c('Action').t`Deselect all messages` : c('Action').t`Select all messages`}
            >
                <Checkbox
                    className="select-all"
                    checked={checked}
                    id="idSelectAll"
                    disabled={disabled}
                    loading={loading}
                    onChange={({ target }) => handleAll(target.checked)()}
                    data-test-id="toolbar:select-all"
                >
                    <span className="sr-only">
                        {checked ? c('Action').t`Deselect all messages` : c('Action').t`Select all messages`}
                    </span>
                </Checkbox>
            </Tooltip>
            <ToolbarDropdown disabled={disabled} loading={loading} title={c('Title').t`More selections`} content="">
                {() => (
                    <DropdownMenu>
                        <DropdownMenuButton
                            className="text-left"
                            onClick={handleAll(true)}
                            data-test-id="toolbar:selectall"
                        >
                            <Icon name="selectall" className="mr0-5" />
                            {c('Action').t`Select All`}
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            className="text-left"
                            onClick={handleRead(true)}
                            data-test-id="toolbar:allread"
                        >
                            <Icon name="read" className="mr0-5" />
                            {c('Action').t`All Read`}
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            className="text-left"
                            onClick={handleRead(false)}
                            data-test-id="toolbar:allunread"
                        >
                            <Icon name="unread" className="mr0-5" />
                            {c('Action').t`All Unread`}
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            className="text-left"
                            onClick={handleStarred(true)}
                            data-test-id="toolbar:allstarred"
                        >
                            <Icon name="starfull" className="mr0-5" />
                            {c('Action').t`All Starred`}
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            className="text-left"
                            onClick={handleStarred(false)}
                            data-test-id="toolbar:allunstarred"
                        >
                            <Icon name="star" className="mr0-5" />
                            {c('Action').t`All Unstarred`}
                        </DropdownMenuButton>
                    </DropdownMenu>
                )}
            </ToolbarDropdown>
        </>
    );
};

export default SelectAll;
