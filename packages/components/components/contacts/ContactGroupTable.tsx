import React from 'react';
import { c } from 'ttag';

import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { Table, TableHeader, TableBody, TableRow } from '../table';
import { SmallButton } from '../button';

interface Props {
    contactEmails: ContactEmail[];
    onDelete: (ID: string) => void;
}

const ContactGroupTable = ({ contactEmails, onDelete }: Props) => {
    const header = [c('Table header').t`Name`, c('Table header').t`Address`, c('Table header').t`Action`];
    return (
        <Table className="noborder">
            <TableHeader cells={header} />
            <TableBody>
                {contactEmails.map(({ ID, Name, Email }) => {
                    const cells = [
                        <div className="ellipsis mw100" key={ID} title={Name}>
                            {Name}
                        </div>,
                        <div className="ellipsis mw100" key={ID} title={Email}>
                            {Email}
                        </div>,
                        <SmallButton key={ID} onClick={() => onDelete(ID)}>{c('Action').t`Delete`}</SmallButton>,
                    ];
                    return <TableRow key={ID} cells={cells} />;
                })}
            </TableBody>
        </Table>
    );
};

export default ContactGroupTable;
