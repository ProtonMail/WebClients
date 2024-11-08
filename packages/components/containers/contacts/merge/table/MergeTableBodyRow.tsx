import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useUserKeys } from '@proton/account/userKeys/hooks';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import type OrderableTableBody from '@proton/components/components/orderableTable/OrderableTableBody';
import OrderableTableRow from '@proton/components/components/orderableTable/OrderableTableRow';
import TableRow from '@proton/components/components/table/TableRow';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useContact } from '@proton/mail/contacts/contactHooks';
import type { ContactFormatted } from '@proton/shared/lib/interfaces/contacts';
import isTruthy from '@proton/utils/isTruthy';

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
}

const MergeTableBodyRow = ({
    index,
    ID,
    Contact,
    highlightedID,
    isChecked,
    beDeleted,
    onClickCheckbox,
    onClickDetails,
    onToggleDelete,
}: Props) => {
    const rowRef = useRef<any>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);
    const { Name, emails } = Contact;
    const [userKeysList] = useUserKeys();
    // Allow to control when we fetch contacts and avoid fetching them when the row is not visible
    const [contact] = useContact(isIntersecting ? ID : undefined);
    const { vCardContact } = useVCardContact({ contact, userKeysList });

    const { viewportWidth } = useActiveBreakpoint();

    const deleted = beDeleted[ID];

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        });

        observer.observe(rowRef.current?.node);

        return () => {
            observer.disconnect();
        };
    }, [setIsIntersecting]);

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

    const givenName = vCardContact?.n?.value.givenNames?.join(' ')?.trim() ?? '-';
    const familyName = vCardContact?.n?.value.familyNames?.join(' ')?.trim() ?? '-';

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
        !(givenName === '-' && viewportWidth['<=medium']) && (
            <span className="max-w-full inline-block text-ellipsis">{givenName}</span>
        ),
        !(familyName === '-' && viewportWidth['<=medium']) && (
            <span className="max-w-full inline-block text-ellipsis">{familyName}</span>
        ),
        <EmailsTableCell
            key="email"
            contactID={ID}
            highlightedID={highlightedID}
            emails={emails}
            greyedOut={deleted}
        />,
        <DropdownActions key="options" size="small" list={options} data-testid="merge-model:action-button" />,
    ].filter((cell) => (viewportWidth['<=medium'] ? isTruthy(cell) : true));

    return deleted ? (
        <TableRow key={`${ID}`} cells={[null, ...cells]} />
    ) : (
        <OrderableTableRow key={`${ID}`} index={index} cells={cells} ref={rowRef} />
    );
};

export default MergeTableBodyRow;
