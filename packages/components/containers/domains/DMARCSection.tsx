import { useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import { getBlogURL } from '@proton/shared/lib/helpers/url';

import { Copy, Input, Label, Table, TableBody, TableHeader, TableRow } from '../../components';
import { useNotifications } from '../../hooks';

const DMARCSection = () => {
    const none = <strong key="none">p=none</strong>;
    const reject = <strong key="reject">p=reject</strong>;
    const quarantine = <strong key="quarantine">p=quarantine</strong>;
    const { createNotification } = useNotifications();
    const handleCopy = () => createNotification({ text: c('Success').t`DMARC value copied to clipboard` });
    const dmarcValue = 'v=DMARC1; p=quarantine';
    const [value, setValue] = useState(dmarcValue);
    return (
        <>
            <Alert className="mb-4">
                {c('Info')
                    .t`Major email services may reject or filter your emails to spam if SPF/DKIM/DMARC are missing or not set up properly.`}
                <br />
                {c('Info')
                    .t`DMARC checks if the sender's SPF and DKIM records originate from your domain. This can prevent attackers from using another domain's SPF and DKIM to impersonate your domain. The "p=" (policy) in this record indicates how you want the recipient platforms to handle unauthorized emails. We recommend using the "p=quarantine" policy for most domains. Make sure you add the following TXT record in your DNS console (located on the platform where you purchased the custom domain).`}
                <br />
                <Href href={getBlogURL('/what-is-dmarc')}>{c('Link').t`Learn more`}</Href>
            </Alert>
            <Label>{c('Label')
                .t`Please add the following TXT record. Note: DNS records can take several hours to update.`}</Label>
            <Table responsive="cards" className="mt-4">
                <TableHeader
                    cells={[
                        c('Header for domain modal').t`Type`,
                        c('Header for domain modal').t`Host name`,
                        c('Header for domain modal').t`Value / Data / Points to`,
                    ]}
                />
                <TableBody>
                    <TableRow
                        labels={[
                            c('Header for domain modal').t`Type`,
                            c('Header for domain modal').t`Host name`,
                            c('Header for domain modal').t`Value / Data / Points to`,
                        ]}
                        cells={[
                            <code key="txt">TXT</code>,
                            <code key="dmarc">_dmarc</code>,
                            <div className="flex flex-nowrap items-center" key="value">
                                <Copy onCopy={handleCopy} className="shrink-0 mr-2" size="small" value={value} />{' '}
                                <Input
                                    value={value}
                                    onChange={({ target }) => setValue(target.value)}
                                    placeholder={dmarcValue}
                                />
                            </div>,
                        ]}
                    />
                </TableBody>
            </Table>
            <Alert className="mb-4">
                {/*
                 * translator:
                 * ${quarantine}: quarantine in bold
                 * full sentence for reference: "p=quarantine: Asking the recipient platforms to mark the unauthorized emails as spam or quarantine them."
                 */}
                {c('Info')
                    .jt`${quarantine}: asking the recipient platforms to mark the unauthorized emails as spam or quarantine them.`}
                <br />
                {/*
                 * translator:
                 * ${reject}: reject in bold
                 * full sentence for reference: "p=reject: Asking the recipient platforms to reject the unauthorized emails."
                 */}
                {c('Info').jt`${reject}: asking the recipient platforms to reject the unauthorized emails.`}
                <br />
                {/*
                 * translator:
                 * ${none}: none in bold
                 * full sentence for reference: "p=none: Do not quarantine or reject unauthorized emails. Usually, people only use this policy to troubleshoot or test."
                 */}
                {c('Info')
                    .jt`${none}: do not quarantine or reject unauthorized emails. Usually, people only use this policy to troubleshoot or test.`}
            </Alert>
        </>
    );
};

export default DMARCSection;
