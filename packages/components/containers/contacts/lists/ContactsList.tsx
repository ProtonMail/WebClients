import type { ChangeEvent } from 'react';
import { useMemo, useRef } from 'react';
import { AutoSizer, List } from 'react-virtualized';

import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import type { Recipient, UserModel } from '@proton/shared/lib/interfaces';
import type { ContactFormatted, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';

import { useContactFocus } from '../../../hooks/useContactFocus';
import { useContactHotkeys } from '../../../hooks/useContactHotkeys';
import useItemsDraggable from '../../items/useItemsDraggable';
import ContactRow from './ContactRow';

interface Props {
    contacts: ContactFormatted[];
    contactGroupsMap: SimpleMap<ContactGroup>;
    onCheckOne: (event: ChangeEvent, contactID: string) => void;
    user: UserModel;
    isLargeViewport: boolean;
    onCheck: (contactIDs: string[], checked: boolean, replace: boolean) => void;
    checkedIDs: string[];
    onClick: (contactID: string) => void;
    activateDrag?: boolean;
    onGroupDetails: (contactGroupID: string) => void;
    isDrawer?: boolean;
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
}

const ContactsList = ({
    contacts,
    contactGroupsMap,
    onCheckOne,
    user,
    onCheck,
    checkedIDs,
    onClick,
    activateDrag = true,
    onGroupDetails,
    isDrawer = false,
    onCompose,
}: Props) => {
    const listRef = useRef<List>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);

    const contactIDs: string[] = useMemo(() => {
        return contacts.map((contact) => contact.ID);
    }, [contacts]);

    const handleElement = (id: string) => onClick(id);

    const { focusIndex, getFocusedId, setFocusIndex, handleFocus } = useContactFocus({
        elementIDs: contactIDs,
        listRef: listContainerRef,
    });

    const elementRef = useContactHotkeys(
        {
            elementIDs: contactIDs,
            focusIndex,
        },
        {
            getFocusedId,
            setFocusIndex,
            handleElement,
        }
    );

    // Useless if activateDrag is false but hook has to be run anyway
    const { draggedIDs, handleDragStart, handleDragEnd } = useItemsDraggable(
        contacts,
        checkedIDs,
        onCheck,
        (draggedIDs: string[]) => {
            return `${draggedIDs.length} contacts`;
        }
    );

    const contactRowHeightComfort = 4 * rootFontSize() + 8; // 4 * 16 = we want 72px by default

    return (
        <div ref={elementRef} className="h-full">
            <div ref={listContainerRef} className="min-h-full">
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            className="contacts-list outline-none"
                            ref={listRef}
                            rowRenderer={({ index, style, key }) => (
                                <ContactRow
                                    style={style}
                                    key={key}
                                    checked={checkedIDs.includes(contacts[index].ID)}
                                    hasPaidMail={!!user.hasPaidMail}
                                    contactGroupsMap={contactGroupsMap}
                                    contact={contacts[index]}
                                    onClick={onClick}
                                    onCheck={(event) => onCheckOne(event, contacts[index].ID)}
                                    draggable={activateDrag}
                                    onDragStart={(event) => handleDragStart?.(event, contacts[index])}
                                    onDragEnd={handleDragEnd}
                                    dragged={draggedIDs.includes(contacts[index].ID)}
                                    index={index}
                                    onFocus={handleFocus}
                                    onGroupDetails={onGroupDetails}
                                    isDrawer={isDrawer}
                                    onCompose={onCompose}
                                />
                            )}
                            rowCount={contacts.length}
                            height={height}
                            width={width}
                            rowHeight={contactRowHeightComfort}
                            tabIndex={-1}
                        />
                    )}
                </AutoSizer>
            </div>
        </div>
    );
};

export default ContactsList;
