import { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useItemsSelection } from '@proton/components';
import { useFolders } from '@proton/mail/store/labels/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import { isDraft } from '@proton/shared/lib/mail/messages';
import useFlag from '@proton/unleash/useFlag';

import type { SOURCE_ACTION } from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import { useOnCompose } from 'proton-mail/containers/ComposeProvider';
import { hasLabel, isElementMessage } from 'proton-mail/helpers/elements';
import { setParamsInLocation } from 'proton-mail/helpers/mailboxUrl';
import { APPLY_LOCATION_TYPES } from 'proton-mail/hooks/actions/applyLocation/interface';
import { useApplyLocation } from 'proton-mail/hooks/actions/applyLocation/useApplyLocation';
import { usePermanentDelete } from 'proton-mail/hooks/actions/delete/usePermanentDelete';
import { useMarkAs } from 'proton-mail/hooks/actions/markAs/useMarkAs';
import { useMoveToFolder } from 'proton-mail/hooks/actions/move/useMoveToFolder';
import { ComposeTypes } from 'proton-mail/hooks/composer/useCompose';
import { type ElementsStructure, useGetElementsFromIDs } from 'proton-mail/hooks/mailbox/useElements';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';
import { useMailECRTMetric } from 'proton-mail/metrics/useMailECRTMetric';
import type { ElementsStateParams } from 'proton-mail/store/elements/elementsTypes';
import { useMailSelector } from 'proton-mail/store/hooks';

import { convertCustomViewLabelsToAlmostAllMail, getFolderName } from '../../helpers/labels';
import { useMailboxLayoutProvider } from '../components/MailboxLayoutContext';
import type { RouterNavigation } from '../interface';

interface Params {
    params: ElementsStateParams;
    navigation: RouterNavigation;
    elementsData: ElementsStructure;
}

export const useElementActions = ({ params, navigation, elementsData }: Params) => {
    const { elementID, conversationMode, messageID, labelID: originalLabelID } = params;
    const { handleBack } = navigation;
    const { elementIDs } = elementsData;

    const labelID = convertCustomViewLabelsToAlmostAllMail(originalLabelID);

    const history = useHistory();
    const [isMessageOpening, setIsMessageOpening] = useState(false);

    const { isColumnModeActive, isConversationGroupingEnabled } = useMailboxLayoutProvider();

    const page = useMailSelector((state) => state.elements.page);

    const { selectAll, setSelectAll } = useSelectAll({ labelID });
    const { handleDelete: permanentDelete, deleteSelectionModal, deleteAllModal } = usePermanentDelete(labelID);

    const { markAs, selectAllMarkModal } = useMarkAs();
    const getElementsFromIDs = useGetElementsFromIDs();
    const { applyLocation } = useApplyLocation();
    const { moveToFolder, moveToSpamModal, moveSnoozedModal, moveScheduledModal, selectAllMoveModal } =
        useMoveToFolder();
    const onCompose = useOnCompose();
    const isRetentionPoliciesEnabled = useFlag('DataRetentionPolicy');

    const [folders] = useFolders();

    const { startECRTMetric } = useMailECRTMetric();

    const onMessageLoad = useCallback(() => setIsMessageOpening(true), []);
    const onMessageReady = useCallback(() => setIsMessageOpening(false), [setIsMessageOpening]);

    const onCheck = (checked: boolean) => {
        // Reset select all state when interacting with checkboxes in the list
        if (selectAll && !checked) {
            setSelectAll(false);
        }
    };

    const selectionConfig = {
        conversationMode,
        activeID: elementID,
        allIDs: elementIDs,
        rowMode: !isColumnModeActive,
        messageID,
        resetDependencies: [isColumnModeActive ? elementID : undefined, labelID, page],
        onCheck,
    };

    const {
        checkedIDs,
        selectedIDs,
        handleCheck,
        handleCheckAll,
        handleCheckOne,
        handleCheckOnlyOne,
        handleCheckRange,
    } = useItemsSelection(selectionConfig);

    const handleElement = useCallback(
        (elementID: string | undefined, preventComposer = false) => {
            startECRTMetric(labelID, elementID);

            const fetchElementThenCompose = async () => {
                // Using the getter to prevent having elements in dependency of the callback
                const [element] = getElementsFromIDs([elementID || '']);
                const isInDeletedFolder =
                    isRetentionPoliciesEnabled && hasLabel(element, MAILBOX_LABEL_IDS.SOFT_DELETED);

                if (isElementMessage(element) && isDraft(element) && !isInDeletedFolder && !preventComposer) {
                    void onCompose({
                        type: ComposeTypes.existingDraft,
                        existingDraft: { localID: element.ID as string, data: element },
                        fromUndo: false,
                    });
                }
                if (isConversationGroupingEnabled && isElementMessage(element)) {
                    onMessageLoad();
                    history.push(
                        setParamsInLocation(history.location, {
                            labelID,
                            elementID: element.ConversationID,
                            messageID: element.ID,
                        })
                    );
                } else {
                    onMessageLoad();
                    history.push(setParamsInLocation(history.location, { labelID, elementID: element.ID }));
                }
                // We preserve checkbox state when opening a new element in row mode
                if (isColumnModeActive) {
                    handleCheckAll(false);
                }
            };

            void fetchElementThenCompose();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-FAC9A0
        [onCompose, isConversationGroupingEnabled, labelID, history]
    );

    const handleMarkAs = useCallback(
        async (
            status: MARK_AS_STATUS,
            sourceAction: SOURCE_ACTION,
            options?: { preventBack?: boolean }
        ): Promise<void> => {
            const isUnread = status === MARK_AS_STATUS.UNREAD;
            const elements = getElementsFromIDs(selectedIDs);

            if (isUnread && !options?.preventBack) {
                handleBack();
            }

            await markAs({
                elements,
                labelID,
                status,
                selectAll,
                onCheckAll: handleCheckAll,
                sourceAction,
                silent: true,
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-6ECBC5
        [selectedIDs, labelID, handleBack, selectAll]
    );

    const handleMove = useCallback(
        async (newLabelID: string, sourceAction: SOURCE_ACTION): Promise<void> => {
            if (selectAll) {
                await moveToFolder({
                    elements: getElementsFromIDs(selectedIDs),
                    sourceLabelID: labelID,
                    destinationLabelID: newLabelID,
                    folderName: getFolderName(newLabelID, folders),
                    selectAll,
                    sourceAction: sourceAction,
                });

                if (selectedIDs.includes(elementID || '')) {
                    handleBack();
                }
            } else {
                await applyLocation({
                    type: APPLY_LOCATION_TYPES.MOVE,
                    elements: getElementsFromIDs(selectedIDs),
                    destinationLabelID: newLabelID,
                });
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-1485DD
        [selectedIDs, elementID, labelID, folders, handleBack, selectAll]
    );

    const handleDelete = useCallback(
        async (sourceAction: SOURCE_ACTION) => {
            await permanentDelete(selectedIDs, sourceAction, selectAll);
        },
        [selectedIDs, permanentDelete, selectAll]
    );

    return {
        handleElement,
        handleMarkAs,
        handleMove,
        handleDelete,
        isMessageOpening,
        onCheck,
        checkedIDs,
        selectedIDs,
        handleCheck,
        handleCheckAll,
        handleCheckOne,
        handleCheckOnlyOne,
        handleCheckRange,
        onMessageLoad,
        onMessageReady,
        deleteSelectionModal,
        deleteAllModal,
        selectAllMarkModal,
        moveToSpamModal,
        moveSnoozedModal,
        moveScheduledModal,
        selectAllMoveModal,
    };
};
