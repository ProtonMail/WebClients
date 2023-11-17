import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import isTruthy from '@proton/utils/isTruthy';

import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../../components';

interface Props {
    contactEmails: ContactEmail[];
    onDelete?: (Email: string) => void;
}

const ContactGroupTable = ({ contactEmails, onDelete }: Props) => {
    return (
        <div className="flex flex-column min-h-custom" style={{ '--min-h-custom': '11.25rem' }}>
            <Table className="border-none">
                <TableHeader>
                    <tr>
                        <TableCell type="header">{c('Table header').t`Name`}</TableCell>
                        <TableCell type="header">{c('Table header').t`Address`}</TableCell>
                        {onDelete ? (
                            <TableCell type="header" className="w-1/5">
                                {c('Table header').t`Action`}
                            </TableCell>
                        ) : null}
                    </tr>
                </TableHeader>
                {contactEmails.length ? (
                    <TableBody>
                        {contactEmails.map(({ ID, Name, Email }) => {
                            const cells = [
                                <div className="text-ellipsis max-w-full" key={ID} title={Name}>
                                    {Name}
                                </div>,
                                <div className="text-ellipsis max-w-full" key={ID} title={Email}>
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
                <div
                    className="flex flex-align-items-center justify-center min-h-custom"
                    style={{ '--min-h-custom': '9.375rem' }}
                >
                    {c('Info').t`No contacts added yet`}
                </div>
            ) : null}
        </div>
    );
};

export default ContactGroupTable;
