import { c } from 'ttag';
import { Alert, Label, Table, TableHeader, TableBody, TableRow, Copy } from '../../components';
import { useNotifications } from '../../hooks';

const SPFSection = () => {
    const { createNotification } = useNotifications();
    const handleCopy = () => createNotification({ text: c('Success').t`SPF value copied to clipboard!` });
    const spf = <code>include:_spf.protonmail.ch</code>;
    const spfValue = <code>v=spf1</code>;
    const valueToCopy = 'v=spf1 include:_spf.protonmail.ch mx ~all';
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
                        c('Header for domain modal').t`Value / Data / Points to`,
                    ]}
                />
                <TableBody>
                    <TableRow
                        cells={[
                            <code key="txt">TXT</code>,
                            <code key="at">@</code>,
                            <div className="flex flex-nowrap flex-align-items-center" key="value">
                                <Copy
                                    size="small"
                                    onCopy={handleCopy}
                                    className="flex-item-noshrink mr0-5"
                                    value={valueToCopy}
                                />{' '}
                                <code className="text-ellipsis" title={valueToCopy}>
                                    {valueToCopy}
                                </code>
                            </div>,
                        ]}
                    />
                </TableBody>
            </Table>
            <Alert>{c('Info')
                .jt`If you want to keep an existing SPF record, you can just add ${spf} to it after the ${spfValue}. Do not create multiple SPF records.`}</Alert>
        </>
    );
};

export default SPFSection;
