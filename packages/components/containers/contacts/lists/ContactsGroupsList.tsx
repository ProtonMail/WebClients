import { ChangeEvent, useMemo, useRef } from 'react';
import { AutoSizer, List } from 'react-virtualized';

import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';

import { classnames } from '../../../helpers';
import { useContactFocus } from '../../../hooks/useContactFocus';
import { useContactHotkeys } from '../../../hooks/useContactHotkeys';
import ContactGroupRow from './ContactGroupRow';

interface Props {
    groups: ContactGroup[];
    groupsEmailsMap: SimpleMap<ContactEmail[]>;
    onCheckOne: (event: ChangeEvent, contactID: string) => void;
    isDesktop: boolean;
    checkedIDs: string[];
    onClick: (contactID: string) => void;
    isDrawer?: boolean;
}

const ContactsGroupsList = ({
    groups,
    groupsEmailsMap,
    onCheckOne,
    isDesktop = true,
    checkedIDs,
    onClick,
    isDrawer = false,
}: Props) => {
    const listRef = useRef<List>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);

    const contactRowHeightComfort = 4 * rootFontSize; // 4 * 16 = we want 64px by default

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
        <div ref={elementRef} className={classnames([isDesktop ? 'items-column-list' : 'items-column-list--mobile'])}>
            <div ref={listContainerRef} className="items-column-list-inner items-column-list-inner--border-none">
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
                                    isDrawer={isDrawer}
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
