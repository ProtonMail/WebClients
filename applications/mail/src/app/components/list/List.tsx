import React, { useState, useEffect, ChangeEvent, DragEvent, useRef, useCallback, memo } from 'react';
import { c, msgid } from 'ttag';
import { useLabels, useContactEmails, useContactGroups, classnames, useHandler, generateUID } from 'react-components';
import { MailSettings, UserSettings } from 'proton-shared/lib/interfaces';
import { DENSITY } from 'proton-shared/lib/constants';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';

import Item from './Item';
import { Element } from '../../models/element';
import EmptyView from '../view/EmptyView';
import { DRAG_ELEMENT_KEY, DRAG_ELEMENT_ID_KEY } from '../../constants';
import { isMessage as testIsMessage } from '../../helpers/elements';
import { usePlaceholders } from '../../hooks/usePlaceholders';

import './Drag.scss';
import { Breakpoints } from '../../models/utils';

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
    conversationMode: boolean;
    isSearch: boolean;
    breakpoints: Breakpoints;
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
    breakpoints
}: Props) => {
    const isCompactView = userSettings.Density === DENSITY.COMPACT;

    const [contacts = []] = useContactEmails() as [ContactEmail[] | undefined, boolean, Error];
    const [contactGroups = []] = useContactGroups();
    const [labels] = useLabels();
    const [lastChecked, setLastChecked] = useState<string>(); // Store ID of the last element ID checked
    const [dragElement, setDragElement] = useState<HTMLDivElement>();
    const [draggedIDs, setDraggedIDs] = useState<string[]>([]);
    const [savedCheck, setSavedCheck] = useState<string[]>();

    const listRef = useRef<HTMLDivElement>(null);

    const elements = usePlaceholders(inputElements, loading, expectedLength);

    useEffect(() => {
        setDraggedIDs([]);

        // Reset checkedIds
        const filteredCheckedIDs = checkedIDs.filter((id) => elements.some((elm) => elm.ID === id));

        if (filteredCheckedIDs !== checkedIDs) {
            onCheck(filteredCheckedIDs, true, true);
        }
    }, [elements]);

    useEffect(() => {
        if (loading) {
            listRef.current?.scroll?.({ top: 0 });
        }
    }, [loading]);

    const handleCheck = useHandler((event: ChangeEvent, elementID: string) => {
        const target = event.target as HTMLInputElement;
        const { shiftKey } = event.nativeEvent as any;
        const elementIDs = [elementID];

        if (lastChecked && shiftKey) {
            const start = elements.findIndex(({ ID }) => ID === elementID);
            const end = elements.findIndex(({ ID }) => ID === lastChecked);
            elementIDs.push(
                ...elements.slice(Math.min(start, end), Math.max(start, end) + 1).map(({ ID }) => ID || '')
            );
        }

        setLastChecked(elementID);
        onCheck(elementIDs, target.checked, false);
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
                isCompactView && 'is-compact'
            ])}
        >
            <div className="items-column-list-inner flex flex-nowrap flex-column">
                {expectedLength === 0 ? (
                    <EmptyView labelID={labelID} isSearch={isSearch} />
                ) : (
                    elements.map((element, index) => (
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
                            contacts={contacts}
                            contactGroups={contactGroups}
                            onCheck={handleCheck}
                            onClick={onClick}
                            userSettings={userSettings}
                            mailSettings={mailSettings}
                            onDragStart={handleDragStart}
                            onDragCanceled={handleDragCanceled}
                            dragged={draggedIDs.includes(element.ID || '')}
                            index={index}
                            breakpoints={breakpoints}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default memo(List);
