import React from 'react';
import { c } from 'ttag';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../table';
import { Button } from '../button';

interface Props {
    contactEmails: ContactEmail[];
    onDelete?: (Email: string) => void;
}

const ContactGroupTable = ({ contactEmails, onDelete }: Props) => {
    return (
        <>
            <div className="flex flex-column" style={{ minHeight: 180 }}>
                <Table className="no-border">
                    <TableHeader>
                        <tr>
                            <TableCell type="header">{c('Table header').t`Name`}</TableCell>
                            <TableCell type="header">{c('Table header').t`Address`}</TableCell>
                            {onDelete ? (
                                <TableCell type="header" className="w20">
                                    {c('Table header').t`Action`}
                                </TableCell>
                            ) : null}
                        </tr>
                    </TableHeader>
                    {contactEmails.length ? (
                        <TableBody>
                            {contactEmails.map(({ ID, Name, Email }) => {
                                const cells = [
                                    <div className="text-ellipsis max-w100" key={ID} title={Name}>
                                        {Name}
                                    </div>,
                                    <div className="text-ellipsis max-w100" key={ID} title={Email}>
                                        {Email}
                                    </div>,
                                    onDelete ? (
                                        <Button
                                            key={ID || Email}
                                            onClick={() => onDelete(Email)}
                                            color="danger"
                                            shape="outline"
                                            size="small"
                                        >
                                            {c('Action').t`Remove`}
                                        </Button>
                                    ) : null,
                                ].filter(isTruthy);
                                return <TableRow key={ID || Email} cells={cells} />;
                            })}
                        </TableBody>
                    ) : null}
                </Table>

                {!contactEmails.length ? (
                    <div className="flex flex-align-items-center flex-justify-center" style={{ minHeight: 150 }}>
                        {c('Info').t`No contacts added yet`}
                    </div>
                ) : null}
            </div>
        </>
    );
};

export default ContactGroupTable;
