import { c } from 'ttag';
import {
    Button,
    classnames,
    DropdownMenu,
    DropdownMenuButton,
    SimpleDropdown,
    useActiveBreakpoint,
    Icon,
} from '@proton/components';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { MESSAGE_BUTTONS } from '@proton/shared/lib/constants';

import { Filter } from '../../models/tools';

interface Props {
    loading?: boolean;
    filter: Filter;
    onFilter: (filter: Filter) => void;
    mailSettings: MailSettings;
}

const FilterActions = ({ loading, filter = {}, mailSettings, onFilter }: Props) => {
    const noFilterApply = !Object.values(filter).length;
    const { isDesktop } = useActiveBreakpoint();

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
        ...(mailSettings.MessageButtons === MESSAGE_BUTTONS.READ_UNREAD
            ? readUnreadButtons
            : readUnreadButtons.reverse()),
    ];

    if (!isDesktop) {
        const getTextContent = () => {
            const { text = '' } = buttons.find(({ isActive }) => isActive) || {};
            return text;
        };

        return (
            <SimpleDropdown
                as={Button}
                shape="ghost"
                size="small"
                hasCaret={false}
                content={
                    <span className="flex flex-align-items-center flex-nowrap" data-testid="toolbar:filter-dropdown">
                        <Icon className="toolbar-icon mr0-5" name="filter" />
                        <span className="text-sm m0">{getTextContent()}</span>
                    </span>
                }
            >
                <DropdownMenu>
                    {buttons.map(({ ID, text, isActive, onClick }) => {
                        return (
                            <DropdownMenuButton
                                key={ID}
                                data-testid={ID}
                                onClick={onClick}
                                className="text-left"
                                isSelected={isActive}
                                loading={loading}
                            >
                                {text}
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </SimpleDropdown>
        );
    }
    return (
        <div className="flex">
            {buttons.map(({ ID, text, isActive, onClick }) => {
                return (
                    <Button
                        key={ID}
                        data-testid={ID}
                        size="small"
                        shape="ghost"
                        loading={loading}
                        aria-pressed={isActive}
                        className={classnames([
                            'text-sm mt0 mb0 mr0-25 ml0-25',
                            isActive && 'no-pointer-events bg-strong',
                        ])}
                        onClick={onClick}
                    >
                        {text}
                    </Button>
                );
            })}
        </div>
    );
};

export default FilterActions;
