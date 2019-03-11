import React from 'react';
import { c } from 'ttag';
import { Alert, Label, Table, TableHeader, TableBody, TableRow } from 'react-components';

const MXSection = () => {
    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/dns-records/">
                {c('Info')
                    .t`Before you can receive emails for your custom domain addresses at ProtonMail, you need to add the following MX records to your DNS. This can typically be done in the control panel of your domain name registrar.`}
                <br />
                {c('Info').t`Delete any other MX records or make sure ProtonMail's Priority is the lowest number.`}
                <br />
                {c('Info')
                    .t`If this domain is currently actively receiving emails, create all used email addresses in Step 3 before changing MX record to ensure a smooth transition.`}
            </Alert>
            <Label>{c('Label')
                .t`Please add the following MX record. Note, DNS records can take several hours to update.`}</Label>
            <Table>
                <TableHeader
                    cells={[
                        c('Header for domain modal').t`Type`,
                        c('Header for domain modal').t`Host name`,
                        c('Header for domain modal').t`Value / Data / Points to`,
                        c('Header for domain modal').t`Priority`
                    ]}
                />
                <TableBody>
                    <TableRow cells={['MX', '@', 'mail.protonmail.ch', '10']} />
                    <TableRow cells={['MX', '@', 'mailsec.protonmail.ch', '20']} />
                </TableBody>
            </Table>
        </>
    );
};

export default MXSection;
