import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Alert, Label, Table, TableHeader, TableBody, TableRow } from 'react-components';

const DKIMSection = ({ domain }) => {
    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/anti-spoofing/">
                {c('Info')
                    .t`ProtonMail supports DKIM signing for custom domains! To use DKIM authentication, please add the following TXT record into your DNS for this domain. This can typically be done in the control panel of your domain name registrar.`}
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
                    <TableRow cells={['TXT', 'protonmail._domainkey', domain.DkimPublicKey]} />
                </TableBody>
            </Table>
            <Alert type="warning">{c('Info')
                .t`Keep this record in your DNS for as long as you want to use DKIM. You can change its Value to <code>off</code> to disable DKIM`}</Alert>
        </>
    );
};

DKIMSection.propTypes = {
    domain: PropTypes.object.isRequired
};

export default DKIMSection;
