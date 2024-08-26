import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Alert, Copy, Label, Table, TableBody, TableHeader, TableRow } from '../../components';
import { useNotifications } from '../../hooks';

const MXSection = () => {
    const { createNotification } = useNotifications();
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
    const handleCopy = () => createNotification({ text: c('Success').t`Value copied to clipboard` });
    const mailDomain = 'mail.protonmail.ch';
    const mailsecDomain = 'mailsec.protonmail.ch';
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
                    <TableRow
                        labels={tableTitles}
                        cells={[
                            <code key="mx">MX</code>,
                            <code key="at">@</code>,
                            <div className="flex flex-nowrap items-center" key="value">
                                <Copy size="small" onCopy={handleCopy} className="shrink-0 mr-2" value={mailDomain} />{' '}
                                <code className="text-ellipsis lh-rg" title={mailDomain}>
                                    {mailDomain}
                                </code>
                            </div>,
                            <code key="ten">10</code>,
                        ]}
                    />
                    <TableRow
                        labels={tableTitles}
                        cells={[
                            <code key="mx">MX</code>,
                            <code key="at">@</code>,
                            <div className="flex flex-nowrap items-center" key="value">
                                <Copy
                                    size="small"
                                    onCopy={handleCopy}
                                    className="shrink-0 mr-2"
                                    value={mailsecDomain}
                                />{' '}
                                <code className="text-ellipsis lh-rg" title={mailsecDomain}>
                                    {mailsecDomain}
                                </code>
                            </div>,
                            <code key="twenty">20</code>,
                        ]}
                    />
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
