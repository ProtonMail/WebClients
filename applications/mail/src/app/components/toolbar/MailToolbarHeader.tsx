import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Vr } from '@proton/atoms/Vr/Vr';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { getLabelName } from 'proton-mail/helpers/labels';
import { isColumnMode } from 'proton-mail/helpers/mailSettings';
import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';
import { useMailboxLayoutProvider } from 'proton-mail/router/components/MailboxLayoutContext';
import type { MailboxActions } from 'proton-mail/router/interface';
import {
    selectConversationMode,
    selectElementID,
    selectLabelID,
    selectMessageID,
    selectisSearching,
} from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import MailSearch from '../header/search/MailSearch';
import SnoozeToolbarDropdown from '../list/snooze/containers/SnoozeToolbarDropdown';
import LabelName from './actions/LabelName';
import LabelsAndFolders from './actions/LabelsAndFolders';
import MoreActions from './actions/MoreActions';
import { MoveBackButton } from './actions/MoveBackButton';
import MoveButtons from './actions/MoveButtons';
import NavigationControls from './actions/NavigationControls';
import ReadUnreadButtons from './actions/ReadUnreadButtons';
import { MoreDropdown } from './more-dropdown/MoreDropdown';
import { useMailboxToolbarBreakpoints } from './useMailToolbarResponsive';

interface Props {
    elementsData: ElementsStructure;
    actions: MailboxActions;
}

export const MailToolbarHeader = ({ elementsData, actions }: Props) => {
    const location = useLocation();

    const { ref, isExtraTiny, isTiny, isSmallScreen } = useMailboxToolbarBreakpoints('header');

    const labelID = useMailSelector(selectLabelID);
    const elementID = useMailSelector(selectElementID);
    const messageID = useMailSelector(selectMessageID);
    const conversationMode = useMailSelector(selectConversationMode);
    const isSearching = useMailSelector(selectisSearching);

    const { selectAll: isSelectAll } = useSelectAll({ labelID });
    const { labelDropdownToggleRef, moveDropdownToggleRef, isColumnModeActive } = useMailboxLayoutProvider();

    const [mailSettings] = useMailSettings();
    const isColumn = isColumnMode(mailSettings);

    const [labels] = useLabels();
    const [folders] = useFolders();
    const labelName = getLabelName(labelID, labels, folders);

    const isInDeletedFolder = labelID === MAILBOX_LABEL_IDS.SOFT_DELETED;

    if (isSmallScreen) {
        const actionsInHeader = elementID || actions.selectedIDs.length > 0;

        const content = actionsInHeader ? (
            <>
                {elementID && <MoveBackButton />}
                {!isInDeletedFolder && (
                    <>
                        <ReadUnreadButtons selectedIDs={actions.selectedIDs} onMarkAs={actions.handleMarkAs} />
                        <Vr />
                        <MoveButtons
                            labelID={labelID}
                            isExtraTiny={false}
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
                            <SnoozeToolbarDropdown labelID={labelID} selectedIDs={actions.selectedIDs} />
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
            </>
        ) : (
            <>
                <LabelName selectedIDs={actions.selectedIDs} labelName={labelName} />
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
            </>
        );

        return (
            <>
                <nav
                    className="toolbar toolbar--heavy flex flex-1 flex-nowrap shrink-0 items-center gap-2 no-print toolbar--in-container"
                    data-shortcut-target="mailbox-toolbar"
                    aria-label={c('Label').t`Toolbar`}
                    ref={ref}
                >
                    <div className="flex items-center flex-nowrap toolbar-inner gap-2 ml-2">{content}</div>
                </nav>
                {!elementID && <MailSearch labelID={labelID} location={location} columnMode={isColumn} />}
            </>
        );
    }

    const actionsInHeader = !isColumnModeActive && elementID;
    return actionsInHeader ? (
        <nav
            className="toolbar toolbar--heavy flex flex-nowrap shrink-0 items-center gap-2 no-print flex-auto toolbar--in-container"
            data-shortcut-target="mailbox-toolbar"
            aria-label={c('Label').t`Toolbar`}
            ref={ref}
        >
            <div className="flex items-center toolbar-inner flex-nowrap gap-2">
                <MoveBackButton />
                {!isInDeletedFolder && (
                    <>
                        <ReadUnreadButtons selectedIDs={actions.selectedIDs} onMarkAs={actions.handleMarkAs} />
                        <MoveButtons
                            labelID={labelID}
                            isExtraTiny={false}
                            selectedIDs={actions.selectedIDs}
                            onMove={actions.handleMove}
                            onDelete={actions.handleDelete}
                        />
                        <LabelsAndFolders
                            labelID={labelID}
                            selectedIDs={actions.selectedIDs}
                            labelDropdownToggleRef={labelDropdownToggleRef}
                            moveDropdownToggleRef={moveDropdownToggleRef}
                            onCheckAll={actions.handleCheckAll}
                        />
                        {!isSelectAll && !isExtraTiny && (
                            <SnoozeToolbarDropdown labelID={labelID} selectedIDs={actions.selectedIDs} />
                        )}
                    </>
                )}

                {!isTiny ? (
                    <>
                        <Vr />
                        <NavigationControls
                            loading={elementsData.loading}
                            conversationMode={conversationMode}
                            messageID={messageID}
                            elementIDs={elementsData.elementIDs}
                            onElement={actions.handleElement}
                            labelID={labelID}
                        />
                    </>
                ) : null}
            </div>
        </nav>
    ) : (
        <MailSearch labelID={labelID} location={location} columnMode={isColumn} />
    );
};
