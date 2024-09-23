import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';

import OrderableTableBody from '@proton/components/components/orderableTable/OrderableTableBody';
import type { ContactFormatted } from '@proton/shared/lib/interfaces/contacts';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

import MergeTableBodyRow from './MergeTableBodyRow';

interface Props extends Omit<ComponentProps<typeof OrderableTableBody>, 'colSpan'> {
    contacts: ContactFormatted[];
    vcardContacts?: VCardContact[];
    highlightedID: string;
    isChecked: { [ID: string]: boolean };
    beDeleted: { [ID: string]: boolean };
    onClickCheckbox: (ID: string) => void;
    onClickDetails: (ID: string) => void;
    onToggleDelete: (ID: string) => void;
}

const MergeTableBody = ({
    contacts,
    highlightedID,
    isChecked,
    beDeleted,
    onClickCheckbox,
    onClickDetails,
    onToggleDelete,
    ...rest
}: Props) => {
    const ref = useRef<any>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        observerRef.current = new IntersectionObserver(([entry]) => setIsIntersecting(entry.isIntersecting));
    }, []);

    useEffect(() => {
        if (!observerRef.current || !ref.current) {
            return;
        }

        observerRef.current.observe(ref.current?.node);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [ref]);

    return (
        <OrderableTableBody colSpan={4} {...rest} data-testid="merge-model:merge-table">
            {contacts.map((Contact, i) => (
                <MergeTableBodyRow
                    ref={ref}
                    index={i}
                    key={Contact.ID}
                    ID={Contact.ID}
                    Contact={Contact}
                    highlightedID={highlightedID}
                    isChecked={isChecked}
                    beDeleted={beDeleted}
                    onClickCheckbox={onClickCheckbox}
                    onClickDetails={onClickDetails}
                    onToggleDelete={onToggleDelete}
                    isIntersecting={isIntersecting}
                />
            ))}
        </OrderableTableBody>
    );
};

export default MergeTableBody;
