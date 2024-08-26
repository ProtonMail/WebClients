import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getBlogURL } from '@proton/shared/lib/helpers/url';
import type { Domain } from '@proton/shared/lib/interfaces';
import { DKIM_STATE } from '@proton/shared/lib/interfaces';

import { Alert, Copy, Table, TableBody, TableCell, TableHeader, TableRow } from '../../components';
import { useNotifications } from '../../hooks';

interface Props {
    domain: Partial<Domain>;
}

const DKIMSection = ({ domain }: Props) => {
    const { createNotification } = useNotifications();
    const handleCopy = () => createNotification({ text: c('Success').t`Value copied to clipboard` });
    const { Config, State } = domain?.DKIM || { Config: [], State: DKIM_STATE.DKIM_STATE_DEFAULT };

    return (
        <>
            <Alert className="mb-4">
                {c('Info')
                    .t`Major email services may reject or filter your emails to spam if SPF/DKIM/DMARC are missing or not set up properly.`}
                <br />
                {c('Info')
                    .t`DKIM allows ${BRAND_NAME} to cryptographically sign your emails and prevent attackers from tampering your email. Make sure you add the following three CNAME records in your DNS console (located on the platform where you purchased the custom domain).`}
                <br />
                <Href href={getBlogURL('/what-is-dkim')}>{c('Link').t`Learn more`}</Href>
            </Alert>
            {State === DKIM_STATE.DKIM_STATE_ERROR && (
                <Alert className="mb-4" type="error">
                    {c('Error')
                        .t`We stopped DKIM signing due to problems with your DNS configuration. Please follow the instructions below to resume signing.`}
                </Alert>
            )}
            {State === DKIM_STATE.DKIM_STATE_WARNING && (
                <Alert className="mb-4" type="warning">
                    {c('Warning')
                        .t`We detected a problem with your DNS configuration. Please make sure your records match the instructions below. If the problem persists, we will have to switch DKIM signing off.`}
                </Alert>
            )}
            <p className="mb-4">
                {c('Label')
                    .t`Please add all 3 of the following CNAME records. Note: DNS records can take several hours to update.`}
            </p>
            <Table responsive="cards" className="mt-4">
                <TableHeader>
                    <TableRow>
                        <TableCell type="header" className="w-1/6">
                            {c('Header for domain modal').t`Type`}
                        </TableCell>
                        <TableCell type="header">{c('Header for domain modal').t`Host name`}</TableCell>
                        <TableCell type="header" className="w-1/2">
                            {c('Header for domain modal').t`Value / Data`}
                        </TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Config.map((row) => (
                        <TableRow key={row.Hostname}>
                            <TableCell label={c('Header for domain modal').t`Type`}>
                                <code>CNAME</code>
                            </TableCell>
                            <TableCell label={c('Header for domain modal').t`Host name`}>
                                <div className="flex flex-nowrap items-center">
                                    <Copy
                                        onCopy={handleCopy}
                                        size="small"
                                        className="shrink-0 mr-2"
                                        value={row.Hostname}
                                    />{' '}
                                    <div className="text-ellipsis">
                                        <code title={row.Hostname}>{row.Hostname}</code>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell label={c('Header for domain modal').t`Value / Data`}>
                                <div className="flex flex-nowrap items-center">
                                    <Copy
                                        onCopy={handleCopy}
                                        size="small"
                                        className="shrink-0 mr-2"
                                        value={row.CNAME}
                                    />{' '}
                                    <div className="text-ellipsis">
                                        <code title={row.CNAME}>{row.CNAME}</code>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Alert className="mb-4" type="warning">
                {c('Info')
                    .t`IMPORTANT: If your DNS console does not allow CNAME values to end with a dot, you can remove the last dot in the CNAME values.`}
            </Alert>
        </>
    );
};

export default DKIMSection;
