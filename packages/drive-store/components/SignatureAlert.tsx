import { c } from 'ttag';

import { Alert, TextLoader } from '@proton/components';
import { VERIFICATION_STATUS } from '@proton/crypto';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import type { SignatureIssueLocation, SignatureIssues } from '../store';
import { hasValidAnonymousSignature } from './hasValidAnonymousSignature';

type Props = {
    loading: boolean;
    signatureIssues: SignatureIssues | undefined;
    signatureNetworkError?: boolean;
    signatureEmail: string | undefined;
    isFile: boolean;
    name: string;
    isAnonymous?: boolean;
    corruptedLink?: boolean;
    className?: string;
};

export default function SignatureAlert({
    loading,
    signatureIssues,
    signatureEmail,
    signatureNetworkError,
    isAnonymous,
    corruptedLink,
    className,
    ...props
}: Props) {
    if (loading) {
        return (
            <Alert type="info" className={className}>
                <TextLoader className="m-0">{c('Info').t`Checking signatures`}</TextLoader>
            </Alert>
        );
    }

    if (corruptedLink) {
        return (
            <Alert type="warning" className={className}>
                <span>{c('Info')
                    .t`Unfortunately, it appears that the file or some of its data cannot be decrypted.`}</span>
            </Alert>
        );
    }

    if (signatureNetworkError) {
        return (
            <Alert type="warning" className={className}>
                <span>{c('Info').t`Signature cannot be validated due to network error, please try again later.`}</span>
            </Alert>
        );
    }

    const validAnonymousSignature = !!signatureIssues && isAnonymous && hasValidAnonymousSignature(signatureIssues);

    return (
        <Alert type={signatureIssues && !validAnonymousSignature ? 'error' : 'success'} className={className}>
            <SignatureAlertBody
                signatureIssues={signatureIssues}
                signatureEmail={signatureEmail}
                validAnonymousSignature={validAnonymousSignature}
                {...props}
            />
        </Alert>
    );
}

type PropsBody = {
    signatureIssues: SignatureIssues | undefined;
    signatureEmail: string | undefined;
    isFile: boolean;
    name: string;
    validAnonymousSignature?: boolean;
};

export function SignatureAlertBody({
    signatureIssues,
    signatureEmail,
    validAnonymousSignature,
    isFile,
    name,
}: PropsBody) {
    const fileName = (
        <strong className="text-break" key="fileName">
            {name}
        </strong>
    );

    const emailAddress = (
        <strong className="text-break" key="signatureEmail" data-testid="signature-address">
            {signatureEmail || c('Info').t`an anonymous user`}
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

    if (
        !signatureEmail &&
        (validAnonymousSignature === undefined ? hasValidAnonymousSignature(signatureIssues) : validAnonymousSignature)
    ) {
        return (
            <>
                {isFile
                    ? c('Info')
                          .jt`The digital signature has been partially verified. This file was uploaded using a publicly accessible share link by a user without a ${BRAND_NAME} account, so their identity cannot be verified.`
                    : c('Info')
                          .jt`The digital signature has been partially verified. This folder was uploaded using a publicly accessible share link by a user without a ${BRAND_NAME} account, so their identity cannot be verified.`}
            </>
        );
    }

    const locationTranslations: { [key in SignatureIssueLocation]: string } = {
        passphrase: c('Item').t`keys`,
        hash: c('Item').t`hash key`,
        name: c('Item').t`name`,
        xattrs: c('Item').t`file attributes`,
        contentKeyPacket: c('Item').t`file data key`,
        blocks: c('Item').t`file data`,
        thumbnail: c('Item').t`thumbnail`,
        manifest: c('Item').t`file data order`,
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
        if (signatureEmail) {
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
        if (signatureEmail) {
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
