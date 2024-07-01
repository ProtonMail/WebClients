import { c } from 'ttag';

import { Href } from '@proton/atoms';
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

    /*
     * translator: This string is used in the following sentence
     * "Before you can receive emails for your custom domain addresses at Proton Mail, you need to add the following two MX records in your DNS console (located on the platform where you purchased the custom domain). You can find an example and some helpful tips here."
     */
    const kbLink = <Href href={getKnowledgeBaseUrl('/custom-domain')}>{c('Link').t`here`}</Href>;

    return (
        <>
            <Alert className="mb-4">
                {/*
                 * translator: Variables are the following
                 * ${MAIL_APP_NAME}: Proton Mail string
                 * ${kbLink}: Link redirecting the user to the related knowledge base article
                 * full sentence for reference: "Before you can receive emails for your custom domain addresses at Proton Mail, you need to add the following two MX records in your DNS console (located on the platform where you purchased the custom domain). You can find an example and some helpful tips here."
                 */}
                {c('Info')
                    .jt`Before you can receive emails for your custom domain addresses at ${MAIL_APP_NAME}, you need to add the following two MX records in your DNS console (located on the platform where you purchased the custom domain). You can find an example and some helpful tips ${kbLink}.`}
            </Alert>
            <Label>{c('Label')
                .t`Please add the following two MX records. Note: DNS records can take several hours to update.`}</Label>
            <Table responsive="cards" className="mt-4">
                <TableHeader cells={tableTitles} />
                <TableBody>
                    <TableRow labels={tableTitles} cells={['MX', '@', 'mail.protonmail.ch', '10']} />
                    <TableRow labels={tableTitles} cells={['MX', '@', 'mailsec.protonmail.ch', '20']} />
                </TableBody>
            </Table>
            <Alert className="mb-4">
                {c('Info')
                    .t`Delete any other MX records or make sure ${MAIL_APP_NAME}'s Priority is the lowest number.`}
                <br />
                {/*
                 * translator: Variables are the following
                 * ${MAIL_APP_NAME}: Proton Mail string
                 * ${boldAddresses}: "Addresses" string in bold format
                 * full sentence for reference: "For users who are switching to Proton Mail from another service, select the Addresses tab and add al active email addresses before changing the MX record to ensure a smooth transition."
                 */}
                {c('Info')
                    .jt`For users who are switching to ${MAIL_APP_NAME} from another email service, select the ${boldAddresses} tab and add all active email addresses before changing the MX record to ensure a smooth transition.`}
            </Alert>
        </>
    );
};

export default MXSection;
