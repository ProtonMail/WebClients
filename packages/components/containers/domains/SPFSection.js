import React from 'react';
import { c } from 'ttag';
import { Alert, Label, Table, TableHeader, TableBody, TableRow } from 'react-components';

const SPFSection = () => {
    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/anti-spoofing/">
                {c('Info')
                    .t`SPF is used to specify who is allowed to send email for the domain so we strongly recommend including ProtonMail in your SPF record. Please add the following TXT record into your DNS. This can typically be done in the control panel of your domain name registrar.`}
            </Alert>
            <Label>{c('Label')
                .t`Please add the following TXT record. Note, DNS records can take several hours to update.`}</Label>
            <Table>
                <TableHeader
                    cells={[
                        c('Header for domain modal').t`Type`,
                        c('Header for domain modal').t`Host name`,
                        c('Header for domain modal').t`Value / Data / Points to`
                    ]}
                />
                <TableBody>
                    <TableRow cells={['TXT', '@', 'v=spf1 include:_spf.protonmail.ch mx ~all']} />
                </TableBody>
            </Table>
            <Alert>{c('Info')
                .t`If you want to keep an existing SPF record, you can just add <code>include:_spf.protonmail.ch</code> to it after the <code>v=spf1</code>. Do not create multiple SPF records.`}</Alert>
        </>
    );
};

export default SPFSection;
