import PropTypes from 'prop-types';
import { c } from 'ttag';

import { DKIM_STATE, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Alert, Copy, Table, TableBody, TableCell, TableHeader, TableRow } from '../../components';
import { useNotifications } from '../../hooks';

const DKIMSection = ({ domain }) => {
    const { createNotification } = useNotifications();
    const handleCopy = () => createNotification({ text: c('Success').t`Value copied to clipboard` });
    const {
        DKIM: { Config, State },
    } = domain;

    return (
        <>
            <Alert className="mb1" learnMore={getKnowledgeBaseUrl('/anti-spoofing-custom-domain')}>
                {c('Info')
                    .t`${MAIL_APP_NAME} supports DKIM signing for custom domains. To use DKIM authentication, please add the following CNAME record into your DNS settings for this domain. This can typically be done in the control panel of your domain name registrar.`}
            </Alert>
            {State === DKIM_STATE.DKIM_STATE_ERROR && (
                <Alert className="mb1" type="error">
                    {c('Error')
                        .t`We stopped DKIM signing due to problems with your DNS configuration. Please follow the instructions below to resume signing.`}
                </Alert>
            )}
            {State === DKIM_STATE.DKIM_STATE_WARNING && (
                <Alert className="mb1" type="warning">
                    {c('Warning')
                        .t`We detected a problem with your DNS configuration. Please make sure your records match the instructions below. If the problem persists, we will have to switch DKIM signing off.`}
                </Alert>
            )}
            <p className="mb1">
                {c('Label')
                    .t`Please add all 3 of the following CNAME records. Note, DNS records can take several hours to update.`}
            </p>
            <Table responsive="cards">
                <TableHeader>
                    <TableRow>
                        <TableCell type="header" className="w15">
                            {c('Header for domain modal').t`Type`}
                        </TableCell>
                        <TableCell type="header">{c('Header for domain modal').t`Host name`}</TableCell>
                        <TableCell type="header" className="w50">
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
                                <code>{row.Hostname}</code>
                            </TableCell>
                            <TableCell label={c('Header for domain modal').t`Value / Data`}>
                                <div className="flex flex-nowrap flex-align-items-center">
                                    <Copy
                                        onCopy={handleCopy}
                                        size="small"
                                        className="flex-item-noshrink mr0-5"
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
            <Alert className="mb1" type="warning">
                {c('Info')
                    .t`IMPORTANT: Some registrars do not accept CNAME values with a period at the end (while others require it). If your registrar does not accept your CNAME records, please delete the period at the end of each CNAME value and try again.`}
            </Alert>
            <Alert className="mb1" type="warning">
                {c('Info').t`Keep those records in your DNS for as long as you want to use DKIM.`}
            </Alert>
        </>
    );
};

DKIMSection.propTypes = {
    domain: PropTypes.object.isRequired,
};

export default DKIMSection;
