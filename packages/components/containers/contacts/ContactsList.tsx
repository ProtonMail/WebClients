import { useRef, ChangeEvent, useMemo } from 'react';
import { DENSITY } from '@proton/shared/lib/constants';
import { List, AutoSizer } from 'react-virtualized';
import { ContactFormatted, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { UserModel, UserSettings } from '@proton/shared/lib/interfaces';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import { useContactFocus } from 'proton-mail/src/app/hooks/contact/useContactFocus';
import { useContactHotkeys } from 'proton-mail/src/app/hooks/contact/useContactHotkeys';
import ContactRow from './ContactRow';
import { useItemsDraggable } from '../items';
import { classnames } from '../../helpers';

interface Props {
    contacts: ContactFormatted[];
    contactGroupsMap: SimpleMap<ContactGroup>;
    onCheckOne: (event: ChangeEvent, contactID: string) => void;
    user: UserModel;
    userSettings: UserSettings;
    isDesktop: boolean;
    onCheck: (contactIDs: string[], checked: boolean, replace: boolean) => void;
    checkedIDs: string[];
    onClick: (contactID: string) => void;
    activateDrag?: boolean;
}

const ContactsList = ({
    contacts,
    contactGroupsMap,
    onCheckOne,
    user,
    userSettings,
    isDesktop = true,
    onCheck,
    checkedIDs,
    onClick,
    activateDrag = true,
}: Props) => {
    const listRef = useRef<List>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);
    const isCompactView = userSettings.Density === DENSITY.COMPACT;

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

    const contactRowHeightComfort = 4 * rootFontSize; // 4 * 16 = we want 64px by default
    const contactRowHeightCompact = 3 * rootFontSize; // 3 * 16 = we want 48px by default

    return (
        <div
            ref={elementRef}
            className={classnames([
                isDesktop ? 'items-column-list' : 'items-column-list--mobile',
                isCompactView && 'list-compact',
            ])}
        >
            <div ref={listContainerRef} className="items-column-list-inner items-column-list-inner--no-border">
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            className="contacts-list no-outline"
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
                                />
                            )}
                            rowCount={contacts.length}
                            height={height}
                            width={width}
                            rowHeight={isCompactView ? contactRowHeightCompact : contactRowHeightComfort}
                            tabIndex={-1}
                        />
                    )}
                </AutoSizer>
            </div>
        </div>
    );
};

export default ContactsList;
