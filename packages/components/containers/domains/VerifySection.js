import PropTypes from 'prop-types';
import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Alert, Copy, Label, Table, TableBody, TableHeader, TableRow } from '../../components';
import { useNotifications } from '../../hooks';

const VerifySection = ({ domain }) => {
    const { createNotification } = useNotifications();
    const handleCopy = () => createNotification({ text: c('Success').t`Verification code copied to clipboard` });
    const domainName = domain.DomainName;
    return (
        <>
            <Alert className="mb-4">
                {c('Info for domain modal')
                    .t`For security reasons, we need to verify that you are the owner of ${domainName}. Please add the following DNS TXT record to your domain. This can typically be done in the control panel of your domain name registrar.`}
                <div>
                    <Href href={getKnowledgeBaseUrl('/custom-domain')}>{c('Link').t`Learn more`}</Href>
                </div>
            </Alert>
            <Alert className="mb-4" type="warning">
                {c('Warning for domain modal')
                    .t`After successful verification, do not remove this TXT record as it is needed to confirm that you continue to own the domain.`}
            </Alert>
            <Label>{c('Label for domain modal').t`Please add the following TXT record:`}</Label>
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
                            <code key="at">@</code>,
                            <div className="flex flex-nowrap items-center" key="value">
                                <Copy
                                    onCopy={handleCopy}
                                    size="small"
                                    className="flex-item-noshrink mr-2"
                                    value={domain.VerifyCode}
                                />{' '}
                                <code className="text-ellipsis lh-rg" title={domain.VerifyCode}>
                                    {domain.VerifyCode}
                                </code>
                            </div>,
                        ]}
                    />
                </TableBody>
            </Table>
            <Alert className="mb-4" type="warning">{c('Warning for domain modal')
                .t`It can take up to a day for DNS changes to update.`}</Alert>
        </>
    );
};

VerifySection.propTypes = {
    domain: PropTypes.object.isRequired,
};

export default VerifySection;
