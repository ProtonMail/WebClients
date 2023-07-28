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
    const kbLink = <Href href={getKnowledgeBaseUrl('/custom-domain')}>{c('Link').t`here`}</Href>;
    return (
        <>
            <Alert className="mb-4">
                {/*
                 * translator: Variables are the following
                 * ${domainName}: Domain "name" in bold
                 * ${boldTxt}: text "TXT" in bold
                 * ${kbLink}: Link redirecting the user to the related knowledge base article
                 * full sentence for reference: "For security reasons, we need to verify that you are the owner of ${domainName}. Please add the following TXT record in your DNS console (located on the platform where you purchased the custom domain). You can find and example and some helpful tips here."
                 */}
                {c('Info for domain modal')
                    .jt`For security reasons, we need to verify that you are the owner of ${domainName}. Please add the following TXT record in your DNS console (located on the platform where you purchased the custom domain). You can find and example and some helpful tips ${kbLink}.`}
            </Alert>
            <Alert className="mb-4" type="warning">
                {c('Warning for domain modal')
                    .t`After successful verification, do not remove this TXT record as it is needed to confirm that you continue to own the domain.`}
            </Alert>
            <Label>{c('Label for domain modal')
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
                                <Copy
                                    onCopy={handleCopy}
                                    size="small"
                                    className="shrink-0 mr-2"
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
        </>
    );
};

VerifySection.propTypes = {
    domain: PropTypes.object.isRequired,
};

export default VerifySection;
