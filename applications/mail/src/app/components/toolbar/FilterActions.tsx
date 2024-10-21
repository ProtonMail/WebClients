import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { DropdownMenu, DropdownMenuButton, SimpleDropdown } from '@proton/components';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { MESSAGE_BUTTONS } from '@proton/shared/lib/mail/mailSettings';
import clsx from '@proton/utils/clsx';

import type { Filter } from '../../models/tools';

interface Props {
    filter: Filter;
    onFilter: (filter: Filter) => void;
    mailSettings: MailSettings;
    dropdown?: boolean;
}

const FilterActions = ({ filter = {}, mailSettings, onFilter, dropdown }: Props) => {
    const noFilterApply = !Object.values(filter).length;

    const FILTER_OPTIONS = {
        SHOW_ALL: c('Filter option').t`All`,
        SHOW_UNREAD: c('Filter option').t`Unread`,
        SHOW_READ: c('Filter option').t`Read`,
        SHOW_MOVED_MESSAGE: c('Filter option').t`Show moved message`,
        HIDE_MOVED_MESSAGE: c('Filter option').t`Hide moved message`,
        HAS_FILE: c('Filter option to only show message with attachments').t`Has attachments`,
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
        {
            text: FILTER_OPTIONS.HAS_FILE,
            ID: 'filter-dropdown:has-file',
            isActive: filter.Attachments === 1,
            onClick() {
                onFilter({ Attachments: 1 });
            },
        },
    ];

    if (dropdown) {
        const { text = '' } = buttons.find(({ isActive }) => isActive) || {};

        return (
            <SimpleDropdown
                as={Button}
                shape="ghost"
                size="small"
                hasCaret={true}
                className="toolbar-button toolbar-button--small"
                content={
                    <span className="flex items-center flex-nowrap" data-testid="toolbar:filter-dropdown">
                        <span className="text-sm m-0">{text}</span>
                    </span>
                }
            >
                <DropdownMenu>
                    <div className="text-bold w-full px-4 py-2">{c('Filter').t`Show`}</div>
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
            </SimpleDropdown>
        );
    }

    return (
        <div className="flex flex-nowrap md:gap-1">
            {buttons.map(({ ID, text, isActive, onClick }) => {
                return (
                    <Button
                        key={ID}
                        data-testid={ID}
                        size="small"
                        shape="ghost"
                        aria-pressed={isActive}
                        className={clsx([
                            'toolbar-button toolbar-button--small text-sm m-0',
                            isActive && 'pointer-events-none bg-strong',
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
