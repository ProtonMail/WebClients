import { Checkbox, DropdownMenu, DropdownMenuButton, Icon, Tooltip } from '@proton/components';
import { c } from 'ttag';

import ToolbarDropdown from './ToolbarDropdown';
import { isUnread, isStarred } from '../../helpers/elements';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';

interface Props {
    labelID: string;
    loading?: boolean;
    disabled?: boolean;
    elementIDs: string[];
    checkedIDs: string[];
    onCheck: (IDs: string[], checked: boolean, replace: boolean) => void;
}

const SelectAll = ({ labelID, loading, disabled, elementIDs, checkedIDs, onCheck }: Props) => {
    const getElementsFromIDs = useGetElementsFromIDs();

    const checked = elementIDs.length ? elementIDs.length === checkedIDs.length : false;

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
            <Tooltip title={checked ? c('Action').t`Deselect all messages` : c('Action').t`Select all messages`}>
                <span className="flex ml0-5 pl1 ">
                    <Checkbox
                        className="select-all"
                        checked={checked}
                        id="idSelectAll"
                        disabled={disabled}
                        loading={loading}
                        onChange={({ target }) => handleAll(target.checked)()}
                        data-testid="toolbar:select-all-checkbox"
                    >
                        <span className="sr-only">
                            {checked ? c('Action').t`Deselect all messages` : c('Action').t`Select all messages`}
                        </span>
                    </Checkbox>
                </span>
            </Tooltip>
            <ToolbarDropdown
                disabled={disabled}
                loading={loading}
                title={c('Title').t`More selections`}
                data-testid="toolbar:select-all-dropdown"
            >
                {() => (
                    <DropdownMenu>
                        <DropdownMenuButton
                            className="text-left"
                            onClick={handleAll(true)}
                            data-testid="toolbar:select-all"
                        >
                            <Icon name="check-triple" className="mr0-5" />
                            {c('Action').t`Select All`}
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            className="text-left"
                            onClick={handleRead(true)}
                            data-testid="toolbar:all-read"
                        >
                            <Icon name="eye" className="mr0-5" />
                            {c('Action').t`All Read`}
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            className="text-left"
                            onClick={handleRead(false)}
                            data-testid="toolbar:all-unread"
                        >
                            <Icon name="eye-slash" className="mr0-5" />
                            {c('Action').t`All Unread`}
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            className="text-left"
                            onClick={handleStarred(true)}
                            data-testid="toolbar:all-starred"
                        >
                            <Icon name="star-filled" className="mr0-5" />
                            {c('Action').t`All Starred`}
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            className="text-left"
                            onClick={handleStarred(false)}
                            data-testid="toolbar:all-unstarred"
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
