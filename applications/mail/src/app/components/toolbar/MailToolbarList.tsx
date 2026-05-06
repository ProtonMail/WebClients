import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Vr } from '@proton/atoms/Vr/Vr';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Filter, Sort } from '@proton/shared/lib/mail/search';

import { getLabelName, isLabelIDNewsletterSubscription } from 'proton-mail/helpers/labels';
import { isColumnMode } from 'proton-mail/helpers/mailSettings';
import { pageFromUrl, setFilterInUrl, setPageInUrl, setSortInUrl } from 'proton-mail/helpers/mailboxUrl';
import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';
import { useMailboxLayoutProvider } from 'proton-mail/router/components/MailboxLayoutContext';
import type { MailboxActions } from 'proton-mail/router/interface';
import {
    selectConversationMode,
    selectElementID,
    selectFilter,
    selectLabelID,
    selectSort,
    selectisSearching,
} from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { CategoriesTabs } from '../categoryView/categoriesTabs/CategoriesTabs';
import { useCategoriesView } from '../categoryView/useCategoriesView';
import SnoozeToolbarDropdown from '../list/snooze/containers/SnoozeToolbarDropdown';
import LabelName from './actions/LabelName';
import LabelsAndFolders from './actions/LabelsAndFolders';
import MoreActions from './actions/MoreActions';
import MoveButtons from './actions/MoveButtons';
import PagingControls from './actions/PagingControls';
import ReadUnreadButtons from './actions/ReadUnreadButtons';
import SelectAll from './actions/SelectAll';
import { ListSettings } from './list-settings/ListSettings';
import { MoreDropdown } from './more-dropdown/MoreDropdown';
import { useMailboxToolbarBreakpoints } from './useMailToolbarResponsive';

interface Props {
    elementsData: ElementsStructure;
    actions: MailboxActions;
}

export const MailToolbarList = ({ elementsData, actions }: Props) => {
    const history = useHistory();
    const location = useLocation();

    const { ref, isSmallScreen, isExtraTiny, isTiny, filterAsDropdown } = useMailboxToolbarBreakpoints();

    const sort = useMailSelector(selectSort);
    const filter = useMailSelector(selectFilter);
    const labelID = useMailSelector(selectLabelID);
    const elementID = useMailSelector(selectElementID);
    const isSearching = useMailSelector(selectisSearching);
    const conversationMode = useMailSelector(selectConversationMode);

    const { selectAll: isSelectAll } = useSelectAll({ labelID });
    const { labelDropdownToggleRef, moveDropdownToggleRef } = useMailboxLayoutProvider();

    const { shouldShowTabs } = useCategoriesView();
    const [mailSettings] = useMailSettings();
    const isColumn = isColumnMode(mailSettings);
    const isInDeletedFolder = labelID === MAILBOX_LABEL_IDS.SOFT_DELETED;

    const [labels] = useLabels();
    const [folders] = useFolders();
    const labelName = getLabelName(labelID, labels, folders);

    const handleSort = (sort: Sort) => {
        history.push(setSortInUrl(history.location, sort));
    };

    const handleFilter = (filter: Filter) => {
        history.push(setFilterInUrl(history.location, filter));
    };

    const handlePage = (pageNumber: number) => {
        history.push(setPageInUrl(history.location, pageNumber));
    };

    if (isSmallScreen) {
        const actionsInHeader = elementID;
        if (actionsInHeader) {
            return null;
        }

        return (
            <>
                <nav
                    ref={ref}
                    className="mail-toolbar toolbar toolbar--heavy flex flex-nowrap shrink-0 items-center gap-2 no-print w-full justify-space-between py-1 pl-4 pr-2"
                    data-shortcut-target="mailbox-toolbar"
                    aria-label={c('Label').t`Toolbar`}
                >
                    <div className="flex items-center flex-nowrap toolbar-inner gap-2">
                        <SelectAll
                            labelID={labelID}
                            elementIDs={elementsData.elementIDs}
                            checkedIDs={actions.checkedIDs}
                            onCheck={actions.handleCheck}
                            loading={elementsData.loading}
                        />
                    </div>

                    <div className="flex items-center shrink-0 flex-nowrap toolbar-inner gap-2">
                        {isLabelIDNewsletterSubscription(labelID) ? null : (
                            <ListSettings
                                sort={sort}
                                onSort={handleSort}
                                onFilter={handleFilter}
                                filter={filter}
                                conversationMode={conversationMode}
                                mailSettings={mailSettings}
                                labelID={labelID}
                                filterAsDropdown={filterAsDropdown}
                            />
                        )}

                        <PagingControls
                            loading={elementsData.loading}
                            page={pageFromUrl(location)}
                            total={elementsData.total}
                            onPage={handlePage}
                            showPageNumber={false}
                        />
                    </div>
                </nav>

                {shouldShowTabs && <CategoriesTabs />}
            </>
        );
    }

    const actionsInHeader = !isColumn && elementID;
    if (actionsInHeader) {
        return null;
    }

    return (
        <>
            <nav
                ref={ref}
                className="mail-toolbar toolbar toolbar--heavy flex flex-nowrap shrink-0 items-center gap-2 no-print w-full justify-space-between py-1 pl-4 pr-2"
                data-shortcut-target="mailbox-toolbar"
                aria-label={c('Label').t`Toolbar`}
            >
                <div className="flex items-center flex-nowrap toolbar-inner gap-2">
                    <SelectAll
                        labelID={labelID}
                        elementIDs={elementsData.elementIDs}
                        checkedIDs={actions.checkedIDs}
                        onCheck={actions.handleCheck}
                        loading={elementsData.loading}
                    />
                    <LabelName selectedIDs={actions.selectedIDs} labelName={labelName} />
                    {!isInDeletedFolder && (
                        <>
                            <ReadUnreadButtons selectedIDs={actions.selectedIDs} onMarkAs={actions.handleMarkAs} />
                            <Vr />
                            <MoveButtons
                                // This is needed to avoir showing a <Vr />. Will be removed in a future version.
                                viewportIsNarrow={true}
                                labelID={labelID}
                                isExtraTiny={isExtraTiny}
                                selectedIDs={actions.selectedIDs}
                                onMove={actions.handleMove}
                                onDelete={actions.handleDelete}
                            />
                            {!isExtraTiny && (
                                <LabelsAndFolders
                                    labelID={labelID}
                                    selectedIDs={actions.selectedIDs}
                                    labelDropdownToggleRef={labelDropdownToggleRef}
                                    moveDropdownToggleRef={moveDropdownToggleRef}
                                    onCheckAll={actions.handleCheckAll}
                                />
                            )}
                            {!isExtraTiny && !isSelectAll && (
                                <SnoozeToolbarDropdown selectedIDs={actions.selectedIDs} labelID={labelID} />
                            )}
                            <MoreDropdown
                                elementIDs={elementsData.elementIDs}
                                selectedIDs={actions.selectedIDs}
                                isSearch={isSearching}
                                isNarrow={isTiny}
                                isTiny={isExtraTiny}
                                isExtraTiny={false}
                                onMove={actions.handleMove}
                                onDelete={actions.handleDelete}
                                onCheckAll={actions.handleCheckAll}
                            />
                            <MoreActions selectedIDs={actions.selectedIDs} />
                        </>
                    )}
                </div>

                <div className="flex items-center shrink-0 flex-nowrap toolbar-inner gap-2">
                    {isLabelIDNewsletterSubscription(labelID) ? null : (
                        <ListSettings
                            sort={sort}
                            onSort={handleSort}
                            onFilter={handleFilter}
                            filter={filter}
                            conversationMode={conversationMode}
                            mailSettings={mailSettings}
                            labelID={labelID}
                            filterAsDropdown={filterAsDropdown}
                        />
                    )}

                    <PagingControls
                        loading={elementsData.loading}
                        page={pageFromUrl(location)}
                        total={elementsData.total}
                        onPage={handlePage}
                        showPageNumber={!isExtraTiny}
                    />
                </div>
            </nav>

            {shouldShowTabs && <CategoriesTabs />}
        </>
    );
};
