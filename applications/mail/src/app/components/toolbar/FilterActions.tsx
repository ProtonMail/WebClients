import { c } from 'ttag';

import { DropdownMenu, DropdownMenuButton, Icon, classnames, useMailSettings } from '@proton/components';
import { MESSAGE_BUTTONS } from '@proton/shared/lib/constants';

import { Filter } from '../../models/tools';
import ToolbarDropdown from './ToolbarDropdown';

const { READ_UNREAD } = MESSAGE_BUTTONS;

interface Props {
    icon: boolean;
    filter: Filter;
    onFilter: (filter: Filter) => void;
}

const FilterActions = ({ icon, filter, onFilter }: Props) => {
    const [{ MessageButtons = READ_UNREAD } = {}] = useMailSettings();

    const noFilterApply = !Object.values(filter).length;

    const FILTER_OPTIONS = {
        SHOW_ALL: c('Filter option').t`All`,
        SHOW_UNREAD: c('Filter option').t`Unread`,
        SHOW_READ: c('Filter option').t`Read`,
        SHOW_MOVED_MESSAGE: c('Filter option').t`Show moved message`,
        HIDE_MOVED_MESSAGE: c('Filter option').t`Hide moved message`,
    };

    const readUnreadButtons = [
        {
            text: FILTER_OPTIONS.SHOW_READ,
            ID: 'filter-dropdown:show-read',
            isActive: filter.Unread === 0,
            onClick() {
                if (filter.Unread !== 0) {
                    onFilter({ Unread: 0 });
                }
            },
        },
        {
            text: FILTER_OPTIONS.SHOW_UNREAD,
            ID: 'filter-dropdown:show-unread',
            isActive: filter.Unread === 1,
            onClick() {
                if (filter.Unread !== 1) {
                    onFilter({ Unread: 1 });
                }
            },
        },
    ];

    const buttons = [
        {
            text: FILTER_OPTIONS.SHOW_ALL,
            ID: 'filter-dropdown:show-all',
            isActive: noFilterApply,
            onClick() {
                if (!noFilterApply) {
                    onFilter({});
                }
            },
        },
        ...(MessageButtons === READ_UNREAD ? readUnreadButtons : readUnreadButtons.reverse()),
    ];

    const { text = '' } = buttons.find(({ isActive }) => isActive) || {};

    const dropdownButton = icon ? <Icon className="toolbar-icon" name="lines-long-to-small" /> : text;

    return (
        <ToolbarDropdown
            hasCaret={!icon}
            title={text}
            content={
                <span className="flex flex-align-items-center flex-nowrap" data-testid="toolbar:filter-dropdown">
                    {dropdownButton}
                </span>
            }
            className={classnames([icon && !noFilterApply && 'is-active'])}
        >
            {() => (
                <DropdownMenu>
                    <div className="text-bold w100 pr1 pl1 pt0-5 pb0-5">{c('Filter').t`Show`}</div>
                    {buttons.map(({ ID, text, isActive, onClick }) => {
                        return (
                            <DropdownMenuButton
                                key={ID}
                                data-testid={ID}
                                onClick={onClick}
                                className="text-left"
                                isSelected={isActive}
                            >
                                {text}
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            )}
        </ToolbarDropdown>
    );
};

export default FilterActions;
