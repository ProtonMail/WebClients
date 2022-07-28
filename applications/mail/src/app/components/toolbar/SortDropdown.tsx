import { DropdownMenu, DropdownMenuButton } from '@proton/components';
import { c } from 'ttag';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Sort } from '../../models/tools';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import ToolbarDropdown from './ToolbarDropdown';

const TIME = 'Time';
const SIZE = 'Size';

interface Props {
    labelID: string;
    loading?: boolean;
    conversationMode: boolean;
    sort: Sort;
    onSort: (sort: Sort) => void;
    className?: string;
    isSearch: boolean;
    isScheduledLabel?: boolean;
}

const SortDropdown = ({
    labelID,
    loading,
    conversationMode,
    sort: { sort, desc },
    onSort,
    className,
    isSearch,
}: Props) => {
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
    const getTextContent = () => {
        if (sort === SIZE && !desc) {
            return SORT_OPTIONS.SMALL_TO_LARGE;
        }
        if (sort === SIZE && desc) {
            return SORT_OPTIONS.LARGE_TO_SMALL;
        }
        if (sort === TIME && !desc) {
            // If we are on the scheduled label, we reverse the default sort to have the next to be sent on top (but still displayed as newest)
            return !isScheduledLabel ? SORT_OPTIONS.OLD_TO_NEW : SORT_OPTIONS.NEW_TO_OLD;
        }
        return !isScheduledLabel ? SORT_OPTIONS.NEW_TO_OLD : SORT_OPTIONS.OLD_TO_NEW;
    };
    return (
        <ToolbarDropdown
            shape="ghost"
            size="small"
            className={className}
            content={getTextContent()}
            title={conversationMode ? c('Title').t`Sort conversations` : c('Title').t`Sort messages`}
        >
            {() => (
                <DropdownMenu>
                    <DropdownMenuButton
                        data-testid="toolbar:sort-new-to-old"
                        isSelected={!isScheduledLabel ? sort === TIME && desc : sort === TIME && !desc}
                        className="text-left"
                        loading={loading}
                        onClick={() => onSort({ sort: TIME, desc: true })}
                    >
                        {SORT_OPTIONS.NEW_TO_OLD}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        data-testid="toolbar:sort-old-to-new"
                        isSelected={!isScheduledLabel ? sort === TIME && !desc : sort === TIME && desc}
                        className="text-left"
                        loading={loading}
                        onClick={() => onSort({ sort: TIME, desc: false })}
                    >
                        {SORT_OPTIONS.OLD_TO_NEW}
                    </DropdownMenuButton>
                    {!hideSizeSorting && (
                        <DropdownMenuButton
                            data-testid="toolbar:sort-desc"
                            isSelected={sort === SIZE && desc}
                            className="text-left"
                            loading={loading}
                            onClick={() => onSort({ sort: SIZE, desc: true })}
                        >
                            {SORT_OPTIONS.LARGE_TO_SMALL}
                        </DropdownMenuButton>
                    )}
                    {!hideSizeSorting && (
                        <DropdownMenuButton
                            data-testid="toolbar:sort-asc"
                            isSelected={sort === SIZE && !desc}
                            className="text-left"
                            loading={loading}
                            onClick={() => onSort({ sort: SIZE, desc: false })}
                        >
                            {SORT_OPTIONS.SMALL_TO_LARGE}
                        </DropdownMenuButton>
                    )}
                </DropdownMenu>
            )}
        </ToolbarDropdown>
    );
};

export default SortDropdown;
