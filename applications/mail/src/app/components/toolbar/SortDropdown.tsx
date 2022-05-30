import { c } from 'ttag';
import { classnames, Icon } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Sort } from '../../models/tools';
import ToolbarDropdown from './ToolbarDropdown';
import SortDropdownMenu from './SortDropdownMenu';

const TIME = 'Time';
const SIZE = 'Size';

interface Props {
    labelID: string;
    conversationMode: boolean;
    icon: boolean;
    sort: Sort;
    onSort: (sort: Sort) => void;
    className?: string;
    isSearch: boolean;
}

const SortDropdown = ({
    labelID,
    conversationMode,
    icon,
    sort: { sort, desc },
    onSort,
    className,
    isSearch,
}: Props) => {
    const isScheduledLabel = labelID === MAILBOX_LABEL_IDS.SCHEDULED;

    const SORT_OPTIONS = {
        SMALL_TO_LARGE: c('Sort option').t`Smallest first`,
        LARGE_TO_SMALL: c('Sort option').t`Largest first`,
        NEW_TO_OLD: c('Sort option').t`Newest first`,
        OLD_TO_NEW: c('Sort option').t`Oldest first`,
    };

    const getTextContent = () => {
        if (icon) {
            return (
                <Icon
                    className={classnames(['toolbar-icon mr0-5', (sort !== TIME || !desc) && 'color-primary'])}
                    name="arrow-down-arrow-up"
                />
            );
        }

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
            hasCaret={!icon}
        >
            {() => <SortDropdownMenu labelID={labelID} sort={{ sort, desc }} onSort={onSort} isSearch={isSearch} />}
        </ToolbarDropdown>
    );
};

export default SortDropdown;
