import React from 'react';
import { c } from 'ttag';
import { Button, classnames, useActiveBreakpoint } from 'react-components';
import { MailSettings, UserSettings } from 'proton-shared/lib/interfaces';
import { MESSAGE_BUTTONS, DENSITY } from 'proton-shared/lib/constants';

import { Filter } from '../../models/tools';

interface Props {
    loading?: boolean;
    filter: Filter;
    userSettings: UserSettings;
    onFilter: (filter: Filter) => void;
    mailSettings: MailSettings;
}

const FilterButtons = ({ loading, filter = {}, userSettings, mailSettings, onFilter }: Props) => {
    const noFilterApply = !Object.values(filter).length;
    const { isDesktop } = useActiveBreakpoint();

    const isCompactView = userSettings.Density === DENSITY.COMPACT;

    const FILTER_OPTIONS = {
        SHOW_ALL: c('Filter option').t`All`,
        SHOW_UNREAD: c('Filter option').t`Unread`,
        SHOW_READ: c('Filter option').t`Read`,
        SHOW_MOVED_MESSAGE: c('Filter option').t`Show moved message`,
        HIDE_MOVED_MESSAGE: c('Filter option').t`Hide moved message`,
    };

    const readUnreadButtons = [
        <Button
            data-test-id="filter-dropdown:show-read"
            size="small"
            key="show-read-button"
            shape="ghost"
            loading={loading}
            aria-pressed={filter.Unread === 0}
            className={classnames(['text-sm mt0 mb0 mr0-25', filter.Unread === 0 && 'no-pointer-events bg-strong'])}
            onClick={() => filter.Unread !== 0 && onFilter({ Unread: 0 })}
        >
            {FILTER_OPTIONS.SHOW_READ}
        </Button>,
        <Button
            data-test-id="filter-dropdown:show-unread"
            size="small"
            key="show-unread-button"
            shape="ghost"
            loading={loading}
            aria-pressed={filter.Unread === 1}
            className={classnames(['text-sm mt0 mb0 mr0-25', filter.Unread === 1 && 'no-pointer-events bg-strong'])}
            onClick={() => filter.Unread !== 1 && onFilter({ Unread: 1 })}
        >
            {FILTER_OPTIONS.SHOW_UNREAD}
        </Button>,
    ];

    const buttons =
        mailSettings.MessageButtons === MESSAGE_BUTTONS.READ_UNREAD ? readUnreadButtons : readUnreadButtons.reverse();

    return (
        <div>
            <Button
                data-testid="filter-dropdown:show-all"
                size="small"
                shape="ghost"
                loading={loading}
                aria-pressed={noFilterApply}
                className={classnames([
                    'text-sm mt0 mb0 mr0-25',
                    noFilterApply && 'no-pointer-events bg-strong',
                    isCompactView ? 'ml1' : 'ml0-5',
                ])}
                onClick={() => !noFilterApply && onFilter({})}
            >
                {FILTER_OPTIONS.SHOW_ALL}
            </Button>
            {isDesktop ? buttons : buttons[0]}
        </div>
    );
};

export default FilterButtons;
