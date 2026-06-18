import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Vr } from '@proton/atoms/Vr/Vr';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { getLabelNameForToolbar, isLabelIDNewsletterSubscription } from 'proton-mail/helpers/labels';
import { pageFromUrl, setPageInUrl } from 'proton-mail/helpers/mailboxUrl';
import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';
import { useMailboxLayoutProvider } from 'proton-mail/router/components/MailboxLayoutContext';
import type { MailboxActions } from 'proton-mail/router/interface';
import { selectElementID, selectIsSearching, selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { CategoriesTabs } from '../categoryView/categoriesTabs/CategoriesTabs';
import { useCategoriesView } from '../categoryView/useCategoriesView';
import SnoozeToolbarDropdown from '../list/snooze/containers/SnoozeToolbarDropdown';
import { ClaimProtonAddressToolbarButton } from './actions/ClaimProtonAddressToolbarButton';
import LabelName from './actions/LabelName';
import LabelsAndFolders from './actions/LabelsAndFolders';
import MoreActions from './actions/MoreActions';
import MoveButtons from './actions/MoveButtons';
import PagingControls from './actions/PagingControls';
import ReadUnreadButtons from './actions/ReadUnreadButtons';
import SelectAll from './actions/SelectAll';
import { FilterList } from './filter-list/FilterList';
import { MoreDropdown } from './more-dropdown/MoreDropdown';
import { useMailboxToolbarBreakpoints } from './useMailToolbarResponsive';

interface Props {
    elementsData: ElementsStructure;
    actions: MailboxActions;
}

export const MailToolbarList = ({ elementsData, actions }: Props) => {
    const history = useHistory();
    const location = useLocation();

    const { ref, isSmallScreen, isExtraTiny, isTiny } = useMailboxToolbarBreakpoints('list');

    const labelID = useMailSelector(selectLabelID);
    const elementID = useMailSelector(selectElementID);
    const isSearching = useMailSelector(selectIsSearching);

    const { selectAll: isSelectAll } = useSelectAll({ labelID });
    const { labelDropdownToggleRef, moveDropdownToggleRef, isColumnModeActive } = useMailboxLayoutProvider();

    const { shouldShowTabs } = useCategoriesView();
    const isInDeletedFolder = labelID === MAILBOX_LABEL_IDS.SOFT_DELETED;

    const [labels] = useLabels();
    const [folders] = useFolders();
    const labelName = getLabelNameForToolbar(labelID, labels, folders);

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
                        {isLabelIDNewsletterSubscription(labelID) ? null : <FilterList />}

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

    const actionsInHeader = !isColumnModeActive && elementID;
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
                    <ClaimProtonAddressToolbarButton />

                    {!isInDeletedFolder && (
                        <>
                            <ReadUnreadButtons selectedIDs={actions.selectedIDs} onMarkAs={actions.handleMarkAs} />
                            {actions.selectedIDs.length > 0 && <Vr />}
                            <MoveButtons
                                // This is needed to avoir showing a <Vr />. Will be removed in a future version.
                                labelID={labelID}
                                isExtraTiny={isExtraTiny}
                                viewportIsNarrow
                                selectedIDs={actions.selectedIDs}
                                onMove={actions.handleMove}
                                onDelete={actions.handleDelete}
                            />
                            {!isTiny && (
                                <LabelsAndFolders
                                    labelID={labelID}
                                    selectedIDs={actions.selectedIDs}
                                    labelDropdownToggleRef={labelDropdownToggleRef}
                                    moveDropdownToggleRef={moveDropdownToggleRef}
                                    onCheckAll={actions.handleCheckAll}
                                />
                            )}
                            {!isTiny && !isSelectAll && (
                                <SnoozeToolbarDropdown selectedIDs={actions.selectedIDs} labelID={labelID} />
                            )}
                            <MoreDropdown
                                elementIDs={elementsData.elementIDs}
                                selectedIDs={actions.selectedIDs}
                                isSearch={isSearching}
                                isNarrow={isTiny}
                                isTiny={isTiny}
                                isExtraTiny={isExtraTiny}
                                onMove={actions.handleMove}
                                onDelete={actions.handleDelete}
                                onCheckAll={actions.handleCheckAll}
                            />
                            <MoreActions selectedIDs={actions.selectedIDs} />
                        </>
                    )}
                </div>

                <div className="flex items-center shrink-0 flex-nowrap toolbar-inner gap-2">
                    {isLabelIDNewsletterSubscription(labelID) ? null : <FilterList />}

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
