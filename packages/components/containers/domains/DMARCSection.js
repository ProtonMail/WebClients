import { useState } from 'react';
import { c } from 'ttag';

import { useNotifications } from '../../hooks';
import { Alert, Label, Table, TableHeader, TableBody, TableRow, Copy, Input } from '../../components';

const DMARCSection = () => {
    const none = <strong key="none">p=none</strong>;
    const quarantine = <strong key="quarantine">p=quarantine</strong>;
    const { createNotification } = useNotifications();
    const handleCopy = () => createNotification({ text: c('Success').t`DMARC value copied to clipboard!` });
    const dmarcValue = 'v=DMARC1; p=none';
    const [value, setValue] = useState(dmarcValue);
    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/anti-spoofing/">
                {c('Info')
                    .t`If you have set both SPF and DKIM, DMARC allows you to specify how other email services should deliver email for your domain if both SPF and DKIM checks have failed. This can make it harder for spammers pretending to be you but may also cause delivery issues if not done properly.`}
            </Alert>
            <Label>{c('Label').t`Here is a basic DMARC record that does nothing except email you reports.`}</Label>
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
                            <code key="dmarc">_dmarc</code>,
                            <div className="flex flex-nowrap flex-align-items-center" key="value">
                                <Copy
                                    onCopy={handleCopy}
                                    className="flex-item-noshrink mr0-5"
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
            <Alert>
                {c('Info')
                    .jt`${none} has no effect on email delivery, but we recommend ${quarantine} for better security.`}
            </Alert>
        </>
    );
};

export default DMARCSection;
