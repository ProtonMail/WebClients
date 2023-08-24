import { ComponentProps, Ref, forwardRef } from 'react';

import { c } from 'ttag';

import { useUserKeys } from '@proton/components/hooks/useUserKeys';
import { ContactFormatted } from '@proton/shared/lib/interfaces/contacts';

import { DropdownActions, OrderableTableBody, OrderableTableRow, TableRow } from '../../../../components';
import useContactConditionally from '../../hooks/useContactConditionally';
import useVCardContact from '../../hooks/useVCardContact';
import EmailsTableCell from './EmailsTableCell';
import NameTableCell from './NameTableCell';

interface Props extends Omit<ComponentProps<typeof OrderableTableBody>, 'colSpan'> {
    index: number;
    ID: string;
    Contact: ContactFormatted;
    highlightedID: string;
    isChecked: { [ID: string]: boolean };
    beDeleted: { [ID: string]: boolean };
    onClickCheckbox: (ID: string) => void;
    onClickDetails: (ID: string) => void;
    onToggleDelete: (ID: string) => void;
    isIntersecting: boolean;
}

const MergeTableBodyRow = (
    {
        index,
        ID,
        Contact,
        highlightedID,
        isChecked,
        beDeleted,
        onClickCheckbox,
        onClickDetails,
        onToggleDelete,
        isIntersecting,
    }: Props,
    ref: Ref<any>
) => {
    const { Name, emails } = Contact;
    const [userKeysList] = useUserKeys();
    // Allow to control when we fetch contacts and avoid fetching them when the row is not visible
    const [contact] = useContactConditionally(isIntersecting ? ID : undefined);
    const { vCardContact } = useVCardContact({ contact, userKeysList });

    const deleted = beDeleted[ID];
    const options = [
        !deleted && {
            text: c('Action').t`View`,
            onClick() {
                onClickDetails(ID);
            },
        },
        {
            text: deleted ? c('Action').t`Unmark for deletion` : c('Action').t`Mark for deletion`,
            onClick() {
                onToggleDelete(ID);
            },
        },
    ].filter(Boolean) as { text: string; onClick: () => void }[];

    const cells = [
        <NameTableCell
            key="displayName"
            name={Name}
            contactID={ID}
            highlightedID={highlightedID}
            checked={isChecked[ID]}
            deleted={deleted}
            greyedOut={deleted}
            onToggle={onClickCheckbox}
        />,
        <span className="max-w100 inline-block text-ellipsis">{vCardContact?.n?.value[1] ?? '-'}</span>,
        <span className="max-w100 inline-block text-ellipsis">{vCardContact?.n?.value[0] ?? '-'}</span>,
        <EmailsTableCell
            key="email"
            contactID={ID}
            highlightedID={highlightedID}
            emails={emails}
            greyedOut={deleted}
        />,
        <DropdownActions key="options" size="small" list={options} data-testid="merge-model:action-button" />,
    ];

    return deleted ? (
        <TableRow key={`${ID}`} cells={[null, ...cells]} />
    ) : (
        <OrderableTableRow key={`${ID}`} index={index} cells={cells} ref={ref} />
    );
};

export default forwardRef(MergeTableBodyRow);
