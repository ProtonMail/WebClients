import { c } from 'ttag';

import { Href } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Copy from '@proton/components/components/button/Copy';
import Label from '@proton/components/components/label/Label';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import { getBlogURL } from '@proton/shared/lib/helpers/url';

import { useNotifications } from '../../hooks';

const SPFSection = () => {
    const { createNotification } = useNotifications();
    const handleCopy = () => createNotification({ text: c('Success').t`SPF value copied to clipboard` });
    const spf = <strong>include:_spf.protonmail.ch</strong>;
    const spfValue = <strong>v=spf1</strong>;
    const spfExample = (
        <code>
            v=spf1 <strong>include:_spf.protonmail.ch</strong> include:spf.example.com ~all
        </code>
    );
    const valueToCopy = 'v=spf1 include:_spf.protonmail.ch ~all';
    return (
        <>
            <Alert className="mb-4">
                {c('Info')
                    .t`Major email services may reject or filter your emails to spam if SPF/DKIM/DMARC are missing or not setup properly.`}
                <br />
                {c('Info')
                    .t`SPF clarifies who is allowed to send email for your domain. Make sure you add the following TXT record in your DNS console (located on the platform where you purchased the custom domain).`}
                <br />
                <Href href={getBlogURL('/what-is-sender-policy-framework-spf')}>{c('Link').t`Learn more`}</Href>
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
                            <code key="at">@</code>,
                            <div className="flex flex-nowrap items-center" key="value">
                                <Copy size="small" onCopy={handleCopy} className="shrink-0 mr-2" value={valueToCopy} />{' '}
                                <code className="text-ellipsis lh-rg" title={valueToCopy}>
                                    {valueToCopy}
                                </code>
                            </div>,
                        ]}
                    />
                </TableBody>
            </Table>
            <Alert className="mb-4">
                {/*
                 * translator: Variables are the following
                 * ${spf}: Proton mail spf in bold
                 * ${spfValue}: spf value in bold
                 * full sentence for reference: "Each domain can only have one SPF (TXT) record. If you want to keep the existing SPF (TXT) record, you can add include:_spf.protonmail.ch to your current record (put it after v=spf1)."
                 */}
                {c('Info')
                    .jt`Each domain can only have one SPF (TXT) record. If you want to keep the existing SPF (TXT) record, you can add ${spf} to your current record (put it after ${spfValue}).`}
                <br />
                {/*
                 * translator:
                 * ${spfExample}: spf example inside an HTML code tag
                 * full sentence for reference: "Example: v=spf1 include:_spf.protonmail.ch include:spf.example.com ~all"
                 */}
                {c('Info').jt`Example: ${spfExample}`}
            </Alert>
        </>
    );
};

export default SPFSection;
