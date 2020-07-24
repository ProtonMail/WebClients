import React, { useState, useEffect, ChangeEvent, DragEvent, useRef } from 'react';
import { c, msgid } from 'ttag';
import { Location } from 'history';
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
    onClick: (element: Element) => void;
    location: Location;
    isSearch: boolean;
}

const List = ({
    labelID,
    loading,
    expectedLength,
    elementID,
    userSettings,
    mailSettings,
    columnLayout,
    elements: inputElements = [],
    checkedIDs = [],
    onCheck,
    onClick,
    location,
    isSearch
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

    const handleCheck = (elementID: string) => (event: ChangeEvent) => {
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
    };

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

    const handleDragStart = (element: Element) => (event: DragEvent) => {
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
        dragElement.innerHTML = isMessage
            ? c('Success').ngettext(
                  msgid`Move ${selection.length} message`,
                  `Move ${selection.length} messages`,
                  selection.length
              )
            : c('Success').ngettext(
                  msgid`Move ${selection.length} conversation`,
                  `Move ${selection.length} conversations`,
                  selection.length
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
    };

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
                            location={location}
                            labels={labels}
                            labelID={labelID}
                            loading={loading}
                            columnLayout={columnLayout}
                            elementID={elementID}
                            element={element}
                            checked={checkedIDs.includes(element.ID || '')}
                            contacts={contacts}
                            contactGroups={contactGroups}
                            onCheck={handleCheck(element.ID || '')}
                            onClick={onClick}
                            userSettings={userSettings}
                            mailSettings={mailSettings}
                            onDragStart={handleDragStart(element)}
                            onDragCanceled={handleDragCanceled}
                            dragged={draggedIDs.includes(element.ID || '')}
                            index={index}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default List;
