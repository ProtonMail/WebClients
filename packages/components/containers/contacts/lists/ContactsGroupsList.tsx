import type { ChangeEvent } from 'react';
import { useMemo, useRef } from 'react';
import { AutoSizer, List } from 'react-virtualized';

import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';

import { useContactFocus } from '../../../hooks/useContactFocus';
import { useContactHotkeys } from '../../../hooks/useContactHotkeys';
import ContactGroupRow from './ContactGroupRow';

interface Props {
    groups: ContactGroup[];
    groupsEmailsMap: SimpleMap<ContactEmail[]>;
    onCheckOne: (event: ChangeEvent, contactID: string) => void;
    isLargeViewport: boolean;
    checkedIDs: string[];
    onClick: (contactID: string) => void;
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
}

const ContactsGroupsList = ({
    groups,
    groupsEmailsMap,
    onCheckOne,
    checkedIDs,
    onClick,
    onCompose,
}: Props) => {
    const listRef = useRef<List>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);

    const contactRowHeightComfort = 4 * rootFontSize(); // 4 * 16 = we want 64px by default

    const contactGroupIDs: string[] = useMemo(() => {
        return groups.map((group) => group.ID);
    }, [groups]);

    const handleElement = (id: string) => onClick(id);

    const { focusIndex, getFocusedId, setFocusIndex, handleFocus } = useContactFocus({
        elementIDs: contactGroupIDs,
        listRef: listContainerRef,
    });

    const elementRef = useContactHotkeys(
        {
            elementIDs: contactGroupIDs,
            focusIndex,
        },
        {
            getFocusedId,
            setFocusIndex,
            handleElement,
        }
    );

    return (
        <div ref={elementRef} className="h-full w-full">
            <div ref={listContainerRef} className="min-h-full">
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            className="contacts-list outline-none"
                            ref={listRef}
                            rowRenderer={({ index, style, key }) => (
                                <ContactGroupRow
                                    style={style}
                                    key={key}
                                    checked={checkedIDs.includes(groups[index].ID)}
                                    groupsEmailsMap={groupsEmailsMap}
                                    group={groups[index]}
                                    onClick={onClick}
                                    onCheck={(event) => onCheckOne(event, groups[index].ID)}
                                    index={index}
                                    onFocus={handleFocus}
                                    onCompose={onCompose}
                                />
                            )}
                            rowCount={groups.length}
                            height={height}
                            width={width - 1}
                            rowHeight={contactRowHeightComfort}
                            tabIndex={-1}
                        />
                    )}
                </AutoSizer>
            </div>
        </div>
    );
};

export default ContactsGroupsList;
