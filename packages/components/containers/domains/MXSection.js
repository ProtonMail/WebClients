import { c } from 'ttag';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Alert, Label, Table, TableBody, TableHeader, TableRow } from '../../components';

const MXSection = () => {
    const boldAddresses = <strong key="addresses">{c('Tab in domain modal').t`Addresses`}</strong>;
    const tableTitles = [
        c('Header for domain modal').t`Type`,
        c('Header for domain modal').t`Host name`,
        c('Header for domain modal').t`Value / Data / Points to`,
        c('Header for domain modal').t`Priority`,
    ];

    return (
        <>
            <Alert className="mb1" learnMore={getKnowledgeBaseUrl('/custom-domain')}>
                {c('Info')
                    .t`Before you can receive emails for your custom domain addresses at ${MAIL_APP_NAME}, you need to add the following MX records to your DNS. This can typically be done in the control panel of your domain name registrar.`}
            </Alert>
            <Label>{c('Label')
                .t`Please add the following MX record. Note, DNS records can take several hours to update.`}</Label>
            <Table responsive="cards">
                <TableHeader cells={tableTitles} />
                <TableBody>
                    <TableRow labels={tableTitles} cells={['MX', '@', 'mail.protonmail.ch', '10']} />
                    <TableRow labels={tableTitles} cells={['MX', '@', 'mailsec.protonmail.ch', '20']} />
                </TableBody>
            </Table>
            <Alert className="mb1">
                {c('Info')
                    .t`Delete any other MX records or make sure ${MAIL_APP_NAME}'s Priority is the lowest number.`}
                <br />
                {c('Info')
                    .jt`If this domain is currently receiving emails, select the ${boldAddresses} tab and add all active email addresses before changing the MX record to ensure a smooth transition.`}
            </Alert>
        </>
    );
};

export default MXSection;
