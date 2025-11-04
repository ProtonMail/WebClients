import { SortableList } from '@proton/components/components/dnd/SortableList';
import TableBody from '@proton/components/components/table/TableBody';
import type { ContactFormatted } from '@proton/shared/lib/interfaces/contacts';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

import MergeTableBodyRow from './MergeTableBodyRow';

interface Props {
    contacts: ContactFormatted[];
    vcardContacts?: VCardContact[];
    highlightedID: string;
    isChecked: { [ID: string]: boolean };
    beDeleted: { [ID: string]: boolean };
    onClickCheckbox: (ID: string) => void;
    onClickDetails: (ID: string) => void;
    onToggleDelete: (ID: string) => void;
    onSortEnd: ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => void;
}

const MergeTableBody = ({
    contacts,
    highlightedID,
    isChecked,
    beDeleted,
    onClickCheckbox,
    onClickDetails,
    onToggleDelete,
    onSortEnd,
    ...rest
}: Props) => {
    const itemIds = contacts.map((item) => item.ID);
    return (
        <TableBody {...rest} data-testid="merge-model:merge-table">
            <SortableList items={itemIds} onSortEnd={onSortEnd}>
                {contacts.map((Contact) => (
                    <MergeTableBodyRow
                        key={Contact.ID}
                        ID={Contact.ID}
                        Contact={Contact}
                        highlightedID={highlightedID}
                        isChecked={isChecked}
                        beDeleted={beDeleted}
                        onClickCheckbox={onClickCheckbox}
                        onClickDetails={onClickDetails}
                        onToggleDelete={onToggleDelete}
                    />
                ))}
            </SortableList>
        </TableBody>
    );
};

export default MergeTableBody;
