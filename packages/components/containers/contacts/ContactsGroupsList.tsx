import React, { useRef, ChangeEvent } from 'react';
import { DENSITY } from '@proton/shared/lib/constants';
import { List, AutoSizer } from 'react-virtualized';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { UserSettings } from '@proton/shared/lib/interfaces';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import { classnames } from '../../helpers';
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
    const containerRef = useRef(null);
    const isCompactView = userSettings.Density === DENSITY.COMPACT;

    const contactRowHeightComfort = 4 * rootFontSize; // 4 * 16 = we want 64px by default
    const contactRowHeightCompact = 3 * rootFontSize; // 3 * 16 = we want 48px by default

    return (
        <div
            ref={containerRef}
            className={classnames([
                isDesktop ? 'items-column-list' : 'items-column-list--mobile',
                isCompactView && 'list-compact',
            ])}
        >
            <div className="items-column-list-inner items-column-list-inner--no-border">
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            className="contacts-list no-outline"
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
                                />
                            )}
                            rowCount={groups.length}
                            height={height}
                            width={width - 1}
                            rowHeight={isCompactView ? contactRowHeightCompact : contactRowHeightComfort}
                        />
                    )}
                </AutoSizer>
            </div>
        </div>
    );
};

export default ContactsGroupsList;
