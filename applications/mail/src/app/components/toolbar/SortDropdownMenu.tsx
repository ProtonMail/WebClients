import { classnames, DropdownMenu, DropdownMenuButton, Icon } from '@proton/components';
import { c } from 'ttag';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Sort } from '../../models/tools';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

const TIME = 'Time';
const SIZE = 'Size';

interface Props {
    labelID: string;
    sort: Sort;
    onSort: (sort: Sort) => void;
    isSearch: boolean;
    borderBottom?: boolean;
}

const SortDropdownMenu = ({ labelID, sort: { sort, desc }, onSort, isSearch, borderBottom }: Props) => {
    const isScheduledLabel = labelID === MAILBOX_LABEL_IDS.SCHEDULED;

    const { getESDBStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled } = getESDBStatus();
    const hideSizeSorting = isSearch && dbExists && esEnabled;
    const SORT_OPTIONS = {
        SMALL_TO_LARGE: c('Sort option').t`Smallest first`,
        LARGE_TO_SMALL: c('Sort option').t`Largest first`,
        NEW_TO_OLD: c('Sort option').t`Newest first`,
        OLD_TO_NEW: c('Sort option').t`Oldest first`,
    };

    const isNewToOld = !isScheduledLabel ? sort === TIME && desc : sort === TIME && !desc;
    const isOldToNew = !isScheduledLabel ? sort === TIME && !desc : sort === TIME && desc;
    const isLargeToSmall = sort === SIZE && desc;
    const isSmallToLarge = sort === SIZE && !desc;

    return (
        <DropdownMenu>
            <div className="text-bold w100 pr1 pl1 pt0-5 pb0-5">{c('Sort').t`Sort`}</div>
            <DropdownMenuButton
                data-testid="toolbar:sort-new-to-old"
                disabled={isNewToOld}
                isSelected={isNewToOld}
                className="flex flex-row"
                onClick={() => onSort({ sort: TIME, desc: true })}
            >
                <span className="text-left flex-item-fluid">{SORT_OPTIONS.NEW_TO_OLD}</span>
                {isNewToOld ? <Icon name="checkmark" /> : null}
            </DropdownMenuButton>
            <DropdownMenuButton
                data-testid="toolbar:sort-old-to-new"
                disabled={isOldToNew}
                isSelected={isOldToNew}
                className={classnames(['flex flex-row', borderBottom && hideSizeSorting && 'border-bottom'])}
                onClick={() => onSort({ sort: TIME, desc: false })}
            >
                <span className="text-left flex-item-fluid">{SORT_OPTIONS.OLD_TO_NEW}</span>
                {isOldToNew ? <Icon name="checkmark" /> : null}
            </DropdownMenuButton>
            {!hideSizeSorting && (
                <DropdownMenuButton
                    data-testid="toolbar:sort-desc"
                    disabled={isLargeToSmall}
                    isSelected={isLargeToSmall}
                    className="flex flex-row"
                    onClick={() => onSort({ sort: SIZE, desc: true })}
                >
                    <span className="text-left flex-item-fluid">{SORT_OPTIONS.LARGE_TO_SMALL}</span>
                    {isLargeToSmall ? <Icon name="checkmark" /> : null}
                </DropdownMenuButton>
            )}
            {!hideSizeSorting && (
                <DropdownMenuButton
                    data-testid="toolbar:sort-asc"
                    disabled={isSmallToLarge}
                    isSelected={isSmallToLarge}
                    className={classnames(['flex flex-row', borderBottom && 'border-bottom'])}
                    onClick={() => onSort({ sort: SIZE, desc: false })}
                >
                    <span className="text-left flex-item-fluid">{SORT_OPTIONS.SMALL_TO_LARGE}</span>
                    {isSmallToLarge ? <Icon name="checkmark" /> : null}
                </DropdownMenuButton>
            )}
        </DropdownMenu>
    );
};

export default SortDropdownMenu;
