import { useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Alert, Copy, Input, Label, Table, TableBody, TableHeader, TableRow } from '../../components';
import { useNotifications } from '../../hooks';

const DMARCSection = () => {
    const none = <strong key="none">p=none</strong>;
    const quarantine = <strong key="quarantine">p=quarantine</strong>;
    const { createNotification } = useNotifications();
    const handleCopy = () => createNotification({ text: c('Success').t`DMARC value copied to clipboard` });
    const dmarcValue = 'v=DMARC1; p=none';
    const [value, setValue] = useState(dmarcValue);
    return (
        <>
            <Alert className="mb-4">
                {c('Info')
                    .t`If you have set both SPF and DKIM, DMARC allows you to specify how other email services should deliver email for your domain if both SPF and DKIM checks have failed. This can make it harder for spammers pretending to be you but may also cause delivery issues if not done properly.`}
                <div>
                    <Href href={getKnowledgeBaseUrl('/anti-spoofing-custom-domain')}>{c('Link').t`Learn more`}</Href>
                </div>
            </Alert>
            <Label>{c('Label').t`Here is a basic DMARC record that does nothing except email you reports.`}</Label>
            <Table responsive="cards">
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
                                <Copy
                                    onCopy={handleCopy}
                                    className="flex-item-noshrink mr-2"
                                    size="small"
                                    value={value}
                                />{' '}
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
                {c('Info')
                    .jt`${none} has no effect on email delivery, but we recommend ${quarantine} for better security.`}
            </Alert>
        </>
    );
};

export default DMARCSection;
