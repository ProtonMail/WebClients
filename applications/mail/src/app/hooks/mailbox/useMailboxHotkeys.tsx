import { useRef } from 'react';
import { useHistory } from 'react-router-dom';

import type { Location } from 'history';

import type { HotkeyTuple } from '@proton/components';
import { useFolders, useHotkeys } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import { VIEW_LAYOUT } from '@proton/shared/lib/mail/mailSettings';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import useMailModel from 'proton-mail/hooks/useMailModel';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';

import { isStarred } from '../../helpers/elements';
import { getFolderName, labelIncludes } from '../../helpers/labels';
import { isConversationMode } from '../../helpers/mailSettings';
import { setParamsInLocation } from '../../helpers/mailboxUrl';
import type { Element } from '../../models/element';
import type { Filter } from '../../models/tools';
import { usePermanentDelete } from '../actions/delete/usePermanentDelete';
import { useMarkAs } from '../actions/markAs/useMarkAs';
import { useMoveToFolder } from '../actions/move/useMoveToFolder';
import { useStar } from '../actions/useStar';
import { useGetElementsFromIDs } from './useElements';
import { useFolderNavigationHotkeys } from './useFolderNavigationHotkeys';

const { TRASH, SPAM, ARCHIVE, INBOX, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT } = MAILBOX_LABEL_IDS;

export interface MailboxHotkeysContext {
    labelID: string;
    elementID?: string;
    messageID?: string;
    elementIDs: string[];
    checkedIDs: string[];
    selectedIDs: string[];
    focusIndex?: number;
    columnLayout: boolean;
    isMessageOpening: boolean;
    location: Location;
}

export interface MailboxHotkeysHandlers {
    handleBack: () => void;
    getFocusedId: () => string | undefined;
    setFocusIndex: (index?: number) => void;
    focusOnLastMessage: () => void;
    handleElement: (ID: string, preventComposer?: boolean) => void;
    handleCheck: (IDs: string[], checked: boolean, replace: boolean) => void;
    handleCheckAll: (checked: boolean) => void;
    handleCheckOnlyOne: (ID: string) => void;
    handleCheckRange: (ID: string) => void;
    handleFilter: (filter: Filter) => void;
    showCommander: (status: boolean) => void;
}

export const useMailboxHotkeys = (
    {
        labelID,
        elementID,
        messageID,
        elementIDs,
        checkedIDs,
        selectedIDs,
        focusIndex,
        columnLayout,
        isMessageOpening,
        location,
    }: MailboxHotkeysContext,
    {
        handleBack,
        getFocusedId,
        setFocusIndex,
        focusOnLastMessage,
        handleElement,
        handleCheck,
        handleCheckAll,
        handleCheckOnlyOne,
        handleCheckRange,
        handleFilter,
        showCommander,
    }: MailboxHotkeysHandlers
) => {
    const mailSettings = useMailModel('MailSettings');
    const { Shortcuts, ViewLayout } = mailSettings;
    const { selectAll } = useSelectAll({ labelID });
    const getElementsFromIDs = useGetElementsFromIDs();
    const history = useHistory<any>();
    const [folders] = useFolders();
    const folderNavigationHotkeys = useFolderNavigationHotkeys();
    const elementIDForList = checkedIDs.length ? undefined : elementID;
    const elementRef = useRef<HTMLDivElement>(null);
    const labelDropdownToggleRef = useRef<() => void>(noop);
    const moveDropdownToggleRef = useRef<() => void>(noop);
    const { moveToFolder, moveScheduledModal, moveSnoozedModal, moveToSpamModal, selectAllMoveModal } =
        useMoveToFolder();
    const star = useStar();
    const { markAs, selectAllMarkModal } = useMarkAs();
    const { handleDelete: permanentDelete, deleteAllModal, deleteSelectionModal } = usePermanentDelete(labelID);

    // Disable selection shortcut in row mode when consulting an message
    // If no element is selected, it means that the user is on the message list, where we want the shortcut to be enabled
    const canSelectItem = ViewLayout === VIEW_LAYOUT.COLUMN || !elementID;

    const getElementsForShortcuts = () => {
        let elements: Element[] = [];
        if (elementID) {
            elements = getElementsFromIDs([elementID]);
        }
        if (checkedIDs.length) {
            elements = getElementsFromIDs(checkedIDs);
        }
        return elements;
    };

    const moveElementsTo = async (e: KeyboardEvent, LabelID: MAILBOX_LABEL_IDS) => {
        const elements = getElementsForShortcuts();
        if (!elements.length) {
            return;
        }
        e.stopPropagation();

        const folderName = getFolderName(LabelID, folders);

        await moveToFolder({
            elements,
            sourceLabelID: labelID,
            destinationLabelID: LabelID,
            folderName,
            selectAll,
            onCheckAll: handleCheckAll,
        });
        if (elementIDForList) {
            handleBack();
        }
    };

    const shortcutHandlers: HotkeyTuple[] = [
        ...folderNavigationHotkeys,
        [
            'ArrowRight',
            (e) => {
                if (columnLayout) {
                    e.preventDefault();
                    e.stopPropagation();
                    focusOnLastMessage();
                }
            },
        ],
        [
            'ArrowLeft',
            (e) => {
                e.preventDefault();
                const sidebarLink = document.querySelector(
                    '[data-shortcut-target~="navigation-link"][aria-current="page"]'
                ) as HTMLElement;
                if (sidebarLink) {
                    sidebarLink.focus();
                    setFocusIndex(undefined);
                }
            },
        ],
        [
            ['Meta', 'K'],
            (e) => {
                e.preventDefault();
                showCommander(true);
            },
        ],
        [
            ['Meta', 'ArrowUp'],
            (e) => {
                e.preventDefault();
                setFocusIndex(0);
            },
        ],
        [
            'ArrowUp',
            (e) => {
                e.preventDefault();
                const previousIndex = focusIndex !== undefined ? Math.max(0, focusIndex - 1) : elementIDs.length - 1;
                setFocusIndex(previousIndex);
            },
        ],
        [
            ['Meta', 'ArrowDown'],
            (e) => {
                e.preventDefault();
                setFocusIndex(elementIDs.length - 1);
            },
        ],
        [
            'ArrowDown',
            (e) => {
                e.preventDefault();
                const nextIndex = focusIndex !== undefined ? Math.min(elementIDs.length - 1, focusIndex + 1) : 0;
                setFocusIndex(nextIndex);
            },
        ],
        [
            'Enter',
            (e) => {
                const id = getFocusedId();
                const { activeElement } = document;

                if (id && activeElement?.tagName.toLocaleLowerCase() !== 'button') {
                    e.stopPropagation();
                    handleElement(id);
                }
            },
        ],
        [
            ['Meta', 'A'],
            (e) => {
                if (Shortcuts) {
                    e.preventDefault();
                    e.stopPropagation();
                    const allChecked = elementIDs.length === checkedIDs.length;
                    handleCheck(elementIDs, !allChecked, true);
                }
            },
        ],
        [
            'X',
            (e) => {
                if (Shortcuts) {
                    const id = getFocusedId();
                    if (id) {
                        e.preventDefault();
                        handleCheckOnlyOne(id);
                    }
                }
            },
        ],
        [
            ['Shift', 'X'],
            (e) => {
                if (Shortcuts) {
                    const id = getFocusedId();
                    if (id) {
                        e.preventDefault();
                        handleCheckRange(id);
                    }
                }
            },
        ],
        [
            KeyboardKey.Spacebar,
            (e) => {
                const id = getFocusedId();
                const { activeElement } = document;
                if (id && activeElement?.tagName.toLocaleLowerCase() !== 'button' && canSelectItem) {
                    e.preventDefault();
                    handleCheckOnlyOne(id);
                }
            },
        ],
        [
            ['Shift', KeyboardKey.Spacebar],
            (e) => {
                const id = getFocusedId();
                if (id) {
                    e.preventDefault();
                    handleCheckRange(id);
                }
            },
        ],
        [
            'Escape',
            (e) => {
                if (checkedIDs.length) {
                    e.stopPropagation();
                    handleCheckAll(false);
                }

                const tmpIndex = focusIndex;
                history.push(
                    setParamsInLocation(history.location, {
                        labelID,
                    })
                );
                setFocusIndex(tmpIndex);
            },
        ],
        [
            ['Shift', 'A'],
            (e) => {
                if (Shortcuts) {
                    e.stopPropagation();
                    handleFilter({});
                }
            },
        ],
        [
            ['Shift', 'U'],
            (e) => {
                if (Shortcuts) {
                    e.stopPropagation();
                    handleFilter({ Unread: 1 });
                }
            },
        ],
        [
            'U',
            async (e) => {
                if (Shortcuts) {
                    const elements = getElementsForShortcuts();
                    if (!elements.length) {
                        return;
                    }
                    e.stopPropagation();
                    handleBack();
                    await markAs({
                        elements,
                        labelID,
                        status: MARK_AS_STATUS.UNREAD,
                        selectAll,
                        onCheckAll: handleCheckAll,
                    });
                }
            },
        ],
        [
            'R',
            async (e) => {
                if (Shortcuts) {
                    const elements = getElementsForShortcuts();
                    if (!elements.length) {
                        return;
                    }
                    e.stopPropagation();
                    await markAs({
                        elements,
                        labelID,
                        status: MARK_AS_STATUS.READ,
                        selectAll,
                        onCheckAll: handleCheckAll,
                    });
                }
            },
        ],
        [
            'A',
            async (e) => {
                if (Shortcuts) {
                    await moveElementsTo(e, ARCHIVE);
                }
            },
        ],
        [
            'I',
            async (e) => {
                if (Shortcuts) {
                    await moveElementsTo(e, INBOX);
                }
            },
        ],
        [
            'S',
            async (e) => {
                if (Shortcuts) {
                    await moveElementsTo(e, SPAM);
                }
            },
        ],
        [
            KeyboardKey.Star,
            async (e) => {
                if (Shortcuts) {
                    const elements = getElementsForShortcuts();
                    if (!elements.length) {
                        return;
                    }
                    e.stopPropagation();
                    const isAllStarred = elements.filter((element) => isStarred(element)).length === elements.length;
                    await star(elements, !isAllStarred);
                }
            },
        ],
        [
            'T',
            async (e) => {
                if (Shortcuts) {
                    await moveElementsTo(e, TRASH);
                }
            },
        ],
        [
            ['Meta', 'Backspace'],
            async () => {
                if (Shortcuts && labelIncludes(labelID, DRAFTS, ALL_DRAFTS, SPAM, TRASH, SENT, ALL_SENT)) {
                    const elements = getElementsForShortcuts();
                    if (!elements.length) {
                        return;
                    }
                    await permanentDelete(elements.map((e) => e.ID).filter(isTruthy), selectAll);
                }
            },
        ],
        [
            'L',
            (e) => {
                if (Shortcuts && selectedIDs.length) {
                    e.preventDefault();
                    labelDropdownToggleRef.current?.();
                }
            },
        ],
        [
            'M',
            (e) => {
                if (Shortcuts && selectedIDs.length) {
                    e.preventDefault();
                    moveDropdownToggleRef.current?.();
                }
            },
        ],
        [
            'K',
            (e) => {
                if (Shortcuts && elementID && !isMessageOpening) {
                    e.preventDefault();

                    const ID =
                        !isConversationMode(labelID, mailSettings, location) && messageID ? messageID : elementID;

                    const index = elementIDs.findIndex((id: string) => id === ID);
                    const previousIndex = index !== null ? Math.max(0, index - 1) : elementIDs.length - 1;

                    if (index === previousIndex) {
                        return;
                    }

                    setFocusIndex(previousIndex);
                    handleElement(elementIDs[previousIndex], true);
                }
            },
        ],
        [
            'J',
            (e) => {
                if (Shortcuts && elementID && !isMessageOpening) {
                    e.preventDefault();

                    const ID =
                        !isConversationMode(labelID, mailSettings, location) && messageID ? messageID : elementID;

                    const index = elementIDs.findIndex((id: string) => id === ID);
                    const nextIndex = index !== null ? Math.min(elementIDs.length - 1, index + 1) : 0;

                    if (index === nextIndex) {
                        return;
                    }

                    setFocusIndex(nextIndex);
                    handleElement(elementIDs[nextIndex], true);
                }
            },
        ],
        [
            'Tab',
            () => {
                const focusedElement = document.querySelector(':focus');
                if (focusedElement && focusedElement !== elementRef.current) {
                    return;
                }
                const element =
                    (document.querySelector(
                        '[data-shortcut-target="item-container"][data-shortcut-target-selected="true"]'
                    ) as HTMLElement) ||
                    (document.querySelector('[data-shortcut-target="item-container"]') as HTMLElement);
                element?.focus();
            },
        ],
    ];

    useHotkeys(elementRef, shortcutHandlers);

    return {
        elementRef,
        labelDropdownToggleRef,
        moveToFolder,
        moveDropdownToggleRef,
        moveScheduledModal,
        moveSnoozedModal,
        deleteAllModal,
        deleteSelectionModal,
        moveToSpamModal,
        selectAllMoveModal,
        selectAllMarkModal,
    };
};
