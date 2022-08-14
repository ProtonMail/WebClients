import { ChangeEvent, useMemo, useRef } from 'react';
import { AutoSizer, List } from 'react-virtualized';

import { DENSITY } from '@proton/shared/lib/constants';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import { UserSettings } from '@proton/shared/lib/interfaces';
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
    userSettings: UserSettings;
    isDesktop: boolean;
    checkedIDs: string[];
    onClick: (contactID: string) => void;
}

const ContactsGroupsList = ({
    groups,
    groupsEmailsMap,
    onCheckOne,
    userSettings,
    isDesktop = true,
    checkedIDs,
    onClick,
}: Props) => {
    const listRef = useRef<List>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);
    const isCompactView = userSettings.Density === DENSITY.COMPACT;

    const contactRowHeightComfort = 4 * rootFontSize; // 4 * 16 = we want 64px by default
    const contactRowHeightCompact = 3 * rootFontSize; // 3 * 16 = we want 48px by default

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
        <div
            ref={elementRef}
            className={classnames([
                isDesktop ? 'items-column-list' : 'items-column-list--mobile',
                isCompactView && 'list-compact',
            ])}
        >
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
                                />
                            )}
                            rowCount={groups.length}
                            height={height}
                            width={width - 1}
                            rowHeight={isCompactView ? contactRowHeightCompact : contactRowHeightComfort}
                            tabIndex={-1}
                        />
                    )}
                </AutoSizer>
            </div>
        </div>
    );
};

export default ContactsGroupsList;
