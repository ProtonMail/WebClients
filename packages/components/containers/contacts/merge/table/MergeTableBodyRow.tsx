import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useUserKeys } from '@proton/account/userKeys/hooks';
import { useSortableListItem } from '@proton/components/components/dnd/SortableListItem';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import { Handle } from '@proton/components/components/table/Handle';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import { useContact } from '@proton/mail/store/contacts/contactHooks';
import type { ContactFormatted } from '@proton/shared/lib/interfaces/contacts';
import clsx from '@proton/utils/clsx';

import useVCardContact from '../../hooks/useVCardContact';
import EmailsTableCell from './EmailsTableCell';
import NameTableCell from './NameTableCell';

interface Props {
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
    ID,
    Contact,
    highlightedID,
    isChecked,
    beDeleted,
    onClickCheckbox,
    onClickDetails,
    onToggleDelete,
}: Props) => {
    const deleted = beDeleted[ID];
    const disableSort = deleted;

    const { isDragging, style, listeners, setNodeRef, attributes } = useSortableListItem({
        id: Contact.ID,
        disabled: disableSort
            ? {
                  draggable: false,
                  droppable: true,
              }
            : undefined,
    });
    const rowRef = useRef<HTMLTableRowElement | null>();
    const [isIntersecting, setIsIntersecting] = useState(false);
    const { Name, emails } = Contact;
    const [userKeysList] = useUserKeys();
    // Allow to control when we fetch contacts and avoid fetching them when the row is not visible
    const [contact] = useContact(isIntersecting ? ID : undefined);
    const { vCardContact } = useVCardContact({ contact, userKeysList });

    useEffect(() => {
        if (!rowRef.current) {
            return;
        }
        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        });

        observer.observe(rowRef.current);

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

    return (
        <TableRow
            key={ID}
            ref={useCallback((el: HTMLTableRowElement | null) => {
                rowRef.current = el;
                setNodeRef(el);
            }, [])}
            dragging={isDragging}
            style={style}
        >
            {disableSort ? (
                <TableCell> </TableCell>
            ) : (
                <TableCell {...listeners} {...attributes}>
                    <Handle />
                </TableCell>
            )}
            <TableCell>
                <NameTableCell
                    key="displayName"
                    name={Name}
                    contactID={ID}
                    highlightedID={highlightedID}
                    checked={isChecked[ID]}
                    deleted={deleted}
                    greyedOut={deleted}
                    onToggle={onClickCheckbox}
                />
            </TableCell>
            <TableCell>
                <span
                    className={clsx([
                        'max-w-full inline-block text-ellipsis',
                        givenName === '-' && 'isHiddenWhenStacked',
                    ])}
                >
                    {givenName}
                </span>
            </TableCell>
            <TableCell>
                <span
                    className={clsx([
                        'max-w-full inline-block text-ellipsis',
                        familyName === '-' && 'isHiddenWhenStacked',
                    ])}
                >
                    {familyName}
                </span>
            </TableCell>
            <TableCell>
                <EmailsTableCell
                    key="email"
                    contactID={ID}
                    highlightedID={highlightedID}
                    emails={emails}
                    greyedOut={deleted}
                />
            </TableCell>
            <TableCell>
                <DropdownActions key="options" size="small" list={options} data-testid="merge-model:action-button" />
            </TableCell>
        </TableRow>
    );
};

export default MergeTableBodyRow;
