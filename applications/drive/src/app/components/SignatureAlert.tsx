import { VERIFICATION_STATUS } from '@proton/crypto';
import { c } from 'ttag';

import { Alert, TextLoader } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { SignatureIssues, SignatureIssueLocation } from '../store';

type Props = {
    loading: boolean;
    signatureIssues: SignatureIssues | undefined;
    signatureAddress: string | undefined;
    isFile: boolean;
    name: string;
    className?: string;
};

export default function SignatureAlert({ loading, signatureIssues, className, ...props }: Props) {
    if (loading) {
        return (
            <Alert type="info" className={className}>
                <TextLoader className="m0">{c('Info').t`Checking signatures`}</TextLoader>
            </Alert>
        );
    }

    return (
        <Alert type={signatureIssues ? 'error' : 'success'} className={className}>
            <SignatureAlertBody signatureIssues={signatureIssues} {...props} />
        </Alert>
    );
}

type PropsBody = {
    signatureIssues: SignatureIssues | undefined;
    signatureAddress: string | undefined;
    isFile: boolean;
    name: string;
};

export function SignatureAlertBody({ signatureIssues, signatureAddress, isFile, name }: PropsBody) {
    const fileName = (
        <strong className="text-break" key="fileName">
            {name}
        </strong>
    );

    const emailAddress = (
        <strong className="text-break" key="signatureAddress">
            {signatureAddress}
        </strong>
    );

    if (!signatureIssues) {
        return (
            <>
                {isFile
                    ? c('Info').jt`Digital signature verified. This file was securely uploaded by ${emailAddress}.`
                    : c('Info').jt`Digital signature verified. This folder was securely uploaded by ${emailAddress}.`}
            </>
        );
    }

    const locationTranslations: { [key in SignatureIssueLocation]: string } = {
        passphrase: c('Item').t`keys`,
        hash: c('Item').t`name hash`,
        name: c('Item').t`name`,
        xattrs: c('Item').t`file attributes`,
        contentKeyPacket: c('Item').t`file data key`,
        blocks: c('Item').t`file data`,
        thumbnail: c('Item').t`thumbnail`,
    };
    const items = Object.keys(signatureIssues)
        .map((location) => locationTranslations[location as SignatureIssueLocation])
        .join(', ');

    const statuses = Object.values(signatureIssues);
    const hasNoSignatureIssue = statuses.some((status) => status === VERIFICATION_STATUS.NOT_SIGNED);
    const hasBadSignatureIssue = statuses.some((status) => status === VERIFICATION_STATUS.SIGNED_AND_INVALID);

    let textReason;
    let textWarning;
    if (hasNoSignatureIssue && !hasBadSignatureIssue) {
        if (signatureAddress) {
            textReason = isFile
                ? c('Info').jt`File is missing signature. We couldn’t verify that ${emailAddress} uploaded ${fileName}.`
                : c('Info')
                      .jt`Folder is missing signature. We couldn’t verify that ${emailAddress} uploaded ${fileName}.`;
        } else {
            textReason = isFile
                ? c('Info').jt`File is missing signature. We couldn’t verify who uploaded ${fileName}.`
                : c('Info').jt`Folder is missing signature. We couldn’t verify who uploaded ${fileName}.`;
        }
        textWarning = c('Info').jt`The following may have been tampered with: ${items}. Only open if you trust it.`;
    } else {
        if (signatureAddress) {
            textReason = c('Info').jt`We couldn’t verify that ${emailAddress} uploaded ${fileName}.`;
            textWarning = c('Info')
                .jt`The account may have a new key, or the following may have been tampered with: ${items}. Only open if you trust it.`;
        } else {
            textReason = c('Info').jt`We couldn’t verify who uploaded ${fileName}.`;
            textWarning = c('Info').jt`The following may have been tampered with: ${items}. Only open if you trust it.`;
        }
    }

    return (
        <>
            {textReason}
            &nbsp;
            {textWarning}
            &nbsp;
            <a href={getKnowledgeBaseUrl('/drive-signature-management')} target="_blank">
                {c('Action').t`Learn more`}
            </a>
        </>
    );
}
