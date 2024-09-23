import { c } from 'ttag';

import { Href } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Copy from '@proton/components/components/button/Copy';
import Label from '@proton/components/components/label/Label';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Domain } from '@proton/shared/lib/interfaces';

import { useNotifications } from '../../hooks';

interface Props {
    domain: Partial<Domain>;
}

const VerifySection = ({ domain }: Props) => {
    const { createNotification } = useNotifications();
    const handleCopy = () => createNotification({ text: c('Success').t`Verification code copied to clipboard` });
    const domainName = domain?.DomainName || '';
    const verifyCode = domain?.VerifyCode || '';
    const kbLink = <Href href={getKnowledgeBaseUrl('/custom-domain')}>{c('Link').t`here`}</Href>;
    return (
        <>
            <Alert className="mb-4">
                {/*
                 * translator: Variables are the following
                 * ${domainName}: Domain "name" in bold
                 * ${boldTxt}: text "TXT" in bold
                 * ${kbLink}: Link redirecting the user to the related knowledge base article
                 * full sentence for reference: "For security reasons, we need to verify that you are the owner of ${domainName}. Please add the following TXT record in your DNS console (located on the platform where you purchased the custom domain). You can find an example and some helpful tips here."
                 */}
                {c('Info for domain modal')
                    .jt`For security reasons, we need to verify that you are the owner of ${domainName}. Please add the following TXT record in your DNS console (located on the platform where you purchased the custom domain). You can find an example and some helpful tips ${kbLink}.`}
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
                                <Copy onCopy={handleCopy} size="small" className="shrink-0 mr-2" value={verifyCode} />{' '}
                                <code className="text-ellipsis lh-rg" title={verifyCode}>
                                    {verifyCode}
                                </code>
                            </div>,
                        ]}
                    />
                </TableBody>
            </Table>
        </>
    );
};

export default VerifySection;
