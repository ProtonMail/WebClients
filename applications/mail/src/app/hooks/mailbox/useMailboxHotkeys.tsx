import { useMemo, useRef } from 'react';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { KeyboardKey } from 'proton-shared/lib/interfaces';
import { HotkeyTuple, useFolders, useHotkeys, useLabels, useMailSettings } from 'react-components';
import { useHistory } from 'react-router-dom';
import { Location } from 'history';
import { noop } from 'proton-shared/lib/helpers/function';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { getFolderName, labelIncludes } from '../../helpers/labels';
import { useMoveToFolder, useStar } from '../useApplyLabels';
import { MARK_AS_STATUS, useMarkAs } from '../useMarkAs';
import { usePermanentDelete } from '../usePermanentDelete';
import { setParamsInLocation } from '../../helpers/mailboxUrl';
import { isStarred } from '../../helpers/elements';
import { useGetElementsFromIDs } from './useElementsCache';
import { Element } from '../../models/element';
import { Filter } from '../../models/tools';
import { useFolderNavigationHotkeys } from './useFolderNavigationHotkeys';
import { isConversationMode } from '../../helpers/mailSettings';

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
    showContentView: boolean;
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
        showContentView,
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
    }: MailboxHotkeysHandlers
) => {
    const [mailSettings] = useMailSettings();
    const { Shortcuts = 0 } = mailSettings || {};
    const getElementsFromIDs = useGetElementsFromIDs();
    const history = useHistory<any>();
    const [folders] = useFolders();
    const [labels] = useLabels();
    const folderNavigationHotkeys = useFolderNavigationHotkeys();

    const labelIDs = labels?.map(({ ID }) => ID);
    const elementIDForList = checkedIDs.length ? undefined : elementID;

    const elementRef = useRef<HTMLDivElement>(null);
    const labelDropdownToggleRef = useRef<() => void>(noop);
    const moveDropdownToggleRef = useRef<() => void>(noop);

    const moveToFolder = useMoveToFolder();
    const star = useStar();
    const markAs = useMarkAs();
    const permanentDelete = usePermanentDelete(labelID);

    const hotkeysEnabledAndListView = useMemo(
        () => Shortcuts && (columnLayout || (!columnLayout && !showContentView)),
        [columnLayout, showContentView, Shortcuts]
    );

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
        const fromLabelID = labelIDs?.includes(labelID) ? INBOX : labelID;

        await moveToFolder(elements, LabelID, folderName, fromLabelID);
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
                if (id && activeElement?.tagName.toLocaleLowerCase() !== 'button') {
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
                if (hotkeysEnabledAndListView) {
                    const elements = getElementsForShortcuts();
                    if (!elements.length) {
                        return;
                    }
                    e.stopPropagation();
                    handleBack();
                    markAs(elements, labelID, MARK_AS_STATUS.UNREAD);
                }
            },
        ],
        [
            'R',
            async (e) => {
                if (hotkeysEnabledAndListView) {
                    const elements = getElementsForShortcuts();
                    if (!elements.length) {
                        return;
                    }
                    e.stopPropagation();
                    markAs(elements, labelID, MARK_AS_STATUS.READ);
                }
            },
        ],
        [
            'A',
            async (e) => {
                if (hotkeysEnabledAndListView) {
                    await moveElementsTo(e, ARCHIVE);
                }
            },
        ],
        [
            'I',
            async (e) => {
                if (hotkeysEnabledAndListView) {
                    await moveElementsTo(e, INBOX);
                }
            },
        ],
        [
            'S',
            async (e) => {
                if (hotkeysEnabledAndListView) {
                    await moveElementsTo(e, SPAM);
                }
            },
        ],
        [
            KeyboardKey.Star,
            async (e) => {
                if (hotkeysEnabledAndListView) {
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
                if (hotkeysEnabledAndListView) {
                    await moveElementsTo(e, TRASH);
                }
            },
        ],
        [
            ['Meta', 'Backspace'],
            async () => {
                if (
                    hotkeysEnabledAndListView &&
                    labelIncludes(labelID, DRAFTS, ALL_DRAFTS, SPAM, TRASH, SENT, ALL_SENT)
                ) {
                    const elements = getElementsForShortcuts();
                    if (!elements.length) {
                        return;
                    }
                    await permanentDelete(elements.map((e) => e.ID).filter(isTruthy));
                }
            },
        ],
        [
            'L',
            (e) => {
                if (hotkeysEnabledAndListView && selectedIDs.length) {
                    e.preventDefault();
                    labelDropdownToggleRef.current?.();
                }
            },
        ],
        [
            'M',
            (e) => {
                if (hotkeysEnabledAndListView && selectedIDs.length) {
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

    return { elementRef, labelDropdownToggleRef, moveDropdownToggleRef };
};
