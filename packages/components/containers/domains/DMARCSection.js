import React from 'react';
import { c } from 'ttag';
import { Alert, Label, LearnMore, Table, TableHeader, TableBody, TableRow } from 'react-components';

const DMARCSection = () => {
    return (
        <>
            <Alert>
                {c('Info')
                    .t`If you have set both SPF and DKIM, DMARC allows you to specify how other email services should deliver email for your domain if both SPF and DKIM checks have failed. This can make it harder for spammers pretending to be you but may also cause delivery issues if not done properly. Feel free to ignore and skip DMARC unless you really want strict policies such as <strong>p=quarantine</strong> or <strong>p=reject</strong>.`}
                <br />
                <LearnMore url="https://protonmail.com/support/knowledge-base/anti-spoofing/" />
            </Alert>
            <Label>{c('Label').t`Here is a basic DMARC record that does nothing except email you reports.`}</Label>
            <Table>
                <TableHeader
                    cells={[
                        c('Header for domain modal').t`Type`,
                        c('Header for domain modal').t`Host name`,
                        c('Header for domain modal').t`Value / Data / Points to`
                    ]}
                />
                <TableBody>
                    <TableRow cells={['TXT', '_dmarc', 'v=DMARC1; p=none; rua=mailto:address@yourdomain.com']} />
                </TableBody>
            </Table>
            <Alert>
                {c('Info').t`<strong>p=none</strong> has no effect on email delivery.`}
                <br />
                {c('Info')
                    .t`<strong>address@yourdomain.com</strong> is where you will receive DMARC reports from other email services.`}
            </Alert>
        </>
    );
};

export default DMARCSection;
