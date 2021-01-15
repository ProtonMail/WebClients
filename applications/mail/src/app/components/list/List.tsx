import React, { useState, useEffect, ChangeEvent, DragEvent, useRef, useCallback, memo } from 'react';
import { c, msgid } from 'ttag';
import { useLabels, classnames, useHandler, generateUID, PaginationRow } from 'react-components';
import { MailSettings, UserSettings } from 'proton-shared/lib/interfaces';
import { DENSITY } from 'proton-shared/lib/constants';

import Item from './Item';
import { Element } from '../../models/element';
import EmptyView from '../view/EmptyView';
import { DRAG_ELEMENT_KEY, DRAG_ELEMENT_ID_KEY } from '../../constants';
import { isMessage as testIsMessage } from '../../helpers/elements';
import { usePlaceholders } from '../../hooks/usePlaceholders';
import { Breakpoints } from '../../models/utils';
import { Page } from '../../models/tools';
import { usePaging } from '../../hooks/usePaging';

import './Drag.scss';

const defaultCheckedIDs: string[] = [];
const defaultElements: Element[] = [];

interface Props {
    labelID: string;
    loading: boolean;
    expectedLength: number;
    elementID?: string;
    userSettings: UserSettings;
    mailSettings: MailSettings;
    columnLayout: boolean;
    elements?: Element[];
    checkedIDs?: string[];
    onCheck: (ID: string[], checked: boolean, replace: boolean) => void;
    onClick: (elementID: string | undefined) => void;
    onFocus: (number: number) => void;
    conversationMode: boolean;
    isSearch: boolean;
    breakpoints: Breakpoints;
    page: Page;
    onPage: (page: number) => void;
    onCheckElement: (ID: string) => void;
    onCheckRange: (ID: string) => void;
}

const List = ({
    labelID,
    loading,
    expectedLength,
    elementID,
    userSettings,
    mailSettings,
    columnLayout,
    elements: inputElements = defaultElements,
    checkedIDs = defaultCheckedIDs,
    onCheck,
    onClick,
    conversationMode,
    isSearch,
    breakpoints,
    page: inputPage,
    onPage,
    onFocus,
    onCheckElement,
    onCheckRange,
}: Props) => {
    const isCompactView = userSettings.Density === DENSITY.COMPACT;

    const [labels] = useLabels();
    const [dragElement, setDragElement] = useState<HTMLDivElement>();
    const [draggedIDs, setDraggedIDs] = useState<string[]>([]);
    const [savedCheck, setSavedCheck] = useState<string[]>();

    const listRef = useRef<HTMLDivElement>(null);

    const elements = usePlaceholders(inputElements, loading, expectedLength);

    const pagingHandlers = usePaging(inputPage, onPage);
    const { page, total } = pagingHandlers;

    useEffect(() => {
        setDraggedIDs([]);

        // Reset checkedIds
        const filteredCheckedIDs = checkedIDs.filter((id) => elements.some((elm) => elm.ID === id));

        if (filteredCheckedIDs !== checkedIDs) {
            onCheck(filteredCheckedIDs, true, true);
        }
    }, [elements]);

    // Scroll top when changing page
    useEffect(() => {
        listRef.current?.scroll?.({ top: 0 });
    }, [loading, page]);

    const handleCheck = useHandler((event: ChangeEvent, elementID: string) => {
        const { shiftKey } = event.nativeEvent as any;

        if (shiftKey) {
            onCheckRange(elementID);
        } else {
            onCheckElement(elementID);
        }
    });

    const clearDragElement = useHandler(() => {
        if (dragElement) {
            document.body.removeChild(dragElement);
            setDragElement(undefined);
        }
    });

    const handleDragCanceled = useHandler(() => {
        clearDragElement();

        setDraggedIDs([]);

        if (savedCheck) {
            onCheck(savedCheck, true, true);
            setSavedCheck(undefined);
        }
    });

    const handleDragSucceed = useHandler((action: string | undefined) => {
        clearDragElement();

        if (savedCheck) {
            if (action === 'link') {
                // Labels
                onCheck(savedCheck, true, true);
            }
            setSavedCheck(undefined);
        }
    });

    const handleDragStart = useCallback(
        (event: DragEvent, element: Element) => {
            const elementID = element.ID || '';
            const dragInSelection = checkedIDs.includes(elementID);
            const selection = dragInSelection ? checkedIDs : [elementID];

            setDraggedIDs(selection);
            setSavedCheck(checkedIDs);

            if (!dragInSelection) {
                onCheck([], true, true);
            }

            const isMessage = testIsMessage(element);
            const dragElement = document.createElement('div');
            const selectionCount = selection.length;
            dragElement.innerHTML = isMessage
                ? c('Success').ngettext(
                      msgid`Move ${selectionCount} message`,
                      `Move ${selectionCount} messages`,
                      selectionCount
                  )
                : c('Success').ngettext(
                      msgid`Move ${selectionCount} conversation`,
                      `Move ${selectionCount} conversations`,
                      selectionCount
                  );
            dragElement.className = 'drag-element p1 bordered-container rounded';
            dragElement.id = generateUID(DRAG_ELEMENT_ID_KEY);
            // Wiring the dragend event on the drag element because the one from drag start is not reliable
            dragElement.addEventListener('dragend', (event) => handleDragSucceed(event.dataTransfer?.dropEffect));
            document.body.appendChild(dragElement);
            event.dataTransfer.setDragImage(dragElement, 0, 0);
            event.dataTransfer.setData(DRAG_ELEMENT_KEY, JSON.stringify(selection));
            event.dataTransfer.setData(DRAG_ELEMENT_ID_KEY, dragElement.id);
            setDragElement(dragElement);
        },
        [checkedIDs, onCheck]
    );

    return (
        <div
            ref={listRef}
            className={classnames([
                'items-column-list scroll-if-needed scroll-smooth-touch',
                isCompactView && 'is-compact',
            ])}
        >
            <h1 className="sr-only">
                {conversationMode ? c('Title').t`Conversation list` : c('Title').t`Message list`}
            </h1>
            <div className="items-column-list-inner flex flex-nowrap flex-column">
                {expectedLength === 0 ? (
                    <EmptyView labelID={labelID} isSearch={isSearch} />
                ) : (
                    <>
                        {elements.map((element, index) => (
                            <Item
                                key={element.ID}
                                conversationMode={conversationMode}
                                labels={labels}
                                labelID={labelID}
                                loading={loading}
                                columnLayout={columnLayout}
                                elementID={elementID}
                                element={element}
                                checked={checkedIDs.includes(element.ID || '')}
                                onCheck={handleCheck}
                                onClick={onClick}
                                userSettings={userSettings}
                                mailSettings={mailSettings}
                                onDragStart={handleDragStart}
                                onDragCanceled={handleDragCanceled}
                                dragged={draggedIDs.includes(element.ID || '')}
                                index={index}
                                breakpoints={breakpoints}
                                onFocus={onFocus}
                            />
                        ))}
                        {!loading && total > 1 && (
                            <div className="p1-5 flex flex-column flex-items-center">
                                <PaginationRow {...pagingHandlers} disabled={loading} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default memo(List);
