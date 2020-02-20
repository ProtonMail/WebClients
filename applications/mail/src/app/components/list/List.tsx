import React, { useState, ChangeEvent } from 'react';
import { Location } from 'history';
import { useLabels, useContactEmails } from 'react-components';

import Item from './Item';
import { Element } from '../../models/element';
import EmptyView from '../view/EmptyView';
import { ContactEmail } from '../../models/contact';
import { useContactGroups } from '../../hooks/useContactGroups';

interface Props {
    labelID: string;
    elementID?: string;
    mailSettings: any;
    elements?: Element[];
    checkedIDs?: string[];
    onCheck: (IDs?: string[], checked?: boolean) => void;
    onClick: (element: Element) => void;
    location: Location;
}

const List = ({
    labelID,
    elementID,
    mailSettings = {},
    elements = [],
    checkedIDs = [],
    onCheck,
    onClick,
    location
}: Props) => {
    const [contacts, loadingContacts] = useContactEmails() as [ContactEmail[], boolean, Error];
    const [contactGroups, loadingGroups] = useContactGroups();
    const [labels] = useLabels();
    const [lastChecked, setLastChecked] = useState(); // Store ID of the last element ID checked

    if (loadingContacts || loadingGroups) {
        return null;
    }

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
        onCheck(elementIDs, target.checked);
    };

    return elements.length === 0 ? (
        <EmptyView labelID={labelID} />
    ) : (
        <>
            {elements.map((element) => {
                return (
                    <Item
                        location={location}
                        labels={labels}
                        labelID={labelID}
                        key={element.ID}
                        elementID={elementID}
                        element={element}
                        checked={checkedIDs.includes(element.ID || '')}
                        contacts={contacts}
                        contactGroups={contactGroups}
                        onCheck={handleCheck(element.ID || '')}
                        onClick={onClick}
                        mailSettings={mailSettings}
                    />
                );
            })}
        </>
    );
};

export default List;
