import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { DropdownMenu, DropdownMenuButton, Icon, SimpleDropdown } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Sort } from '@proton/shared/lib/mail/search';
import clsx from '@proton/utils/clsx';

const TIME = 'Time';
const SIZE = 'Size';

interface Props {
    labelID?: string;
    conversationMode: boolean;
    sort: Sort;
    onSort: (sort: Sort) => void;
    className?: string;
    hasCaret?: boolean;
}

const SortDropdown = ({ labelID, conversationMode, hasCaret, sort: { sort, desc }, onSort, className }: Props) => {
    const isScheduledLabel = labelID === MAILBOX_LABEL_IDS.SCHEDULED;

    const SORT_OPTIONS = {
        SMALL_TO_LARGE: c('Sort option').t`Smallest first`,
        LARGE_TO_SMALL: c('Sort option').t`Largest first`,
        NEW_TO_OLD: c('Sort option').t`Newest first`,
        OLD_TO_NEW: c('Sort option').t`Oldest first`,
    };

    const getIcon = () => {
        if (sort === SIZE && !desc) {
            return <Icon className="toolbar-icon" name="size-arrow-up" title={SORT_OPTIONS.SMALL_TO_LARGE} />;
        }
        if (sort === SIZE && desc) {
            return <Icon className="toolbar-icon" name="size-arrow-down" title={SORT_OPTIONS.LARGE_TO_SMALL} />;
        }
        if (sort === TIME && !desc) {
            // If we are on the scheduled label, we reverse the default sort to have the next to be sent on top (but still displayed as newest)
            return !isScheduledLabel ? (
                <Icon className="toolbar-icon" name="list-arrow-up" title={SORT_OPTIONS.OLD_TO_NEW} />
            ) : (
                <Icon className="toolbar-icon" name="list-arrow-down" title={SORT_OPTIONS.NEW_TO_OLD} />
            );
        }
        return !isScheduledLabel ? (
            <Icon className="toolbar-icon" name="list-arrow-down" title={SORT_OPTIONS.NEW_TO_OLD} />
        ) : (
            <Icon className="toolbar-icon" name="list-arrow-up" title={SORT_OPTIONS.OLD_TO_NEW} />
        );
    };

    return (
        <SimpleDropdown
            as={Button}
            shape="ghost"
            size="small"
            hasCaret={hasCaret}
            originalPlacement="top-end"
            className={clsx(className, 'toolbar-button toolbar-button--small toolbar-button--small-icon')}
            content={
                <span className="flex items-center flex-nowrap" data-testid="toolbar:sort-dropdown">
                    {getIcon()}
                </span>
            }
            title={conversationMode ? c('Title').t`Sort conversations` : c('Title').t`Sort messages`}
        >
            <DropdownMenu>
                <DropdownMenuButton
                    data-testid="toolbar:sort-new-to-old"
                    isSelected={!isScheduledLabel ? sort === TIME && desc : sort === TIME && !desc}
                    className="text-left flex gap-2"
                    onClick={() => onSort({ sort: TIME, desc: true })}
                >
                    <Icon className="toolbar-icon" name="list-arrow-down" />
                    <span>{SORT_OPTIONS.NEW_TO_OLD}</span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    data-testid="toolbar:sort-old-to-new"
                    isSelected={!isScheduledLabel ? sort === TIME && !desc : sort === TIME && desc}
                    className="text-left flex gap-2"
                    onClick={() => onSort({ sort: TIME, desc: false })}
                >
                    <Icon className="toolbar-icon" name="list-arrow-up" />
                    <span>{SORT_OPTIONS.OLD_TO_NEW}</span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    data-testid="toolbar:sort-desc"
                    isSelected={sort === SIZE && desc}
                    className="text-left flex gap-2"
                    onClick={() => onSort({ sort: SIZE, desc: true })}
                >
                    <Icon className="toolbar-icon" name="size-arrow-down" />
                    <span>{SORT_OPTIONS.LARGE_TO_SMALL}</span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    data-testid="toolbar:sort-asc"
                    isSelected={sort === SIZE && !desc}
                    className="text-left flex gap-2"
                    onClick={() => onSort({ sort: SIZE, desc: false })}
                >
                    <Icon className="toolbar-icon" name="size-arrow-up" />
                    <span>{SORT_OPTIONS.SMALL_TO_LARGE}</span>
                </DropdownMenuButton>
            </DropdownMenu>
        </SimpleDropdown>
    );
};

export default SortDropdown;
