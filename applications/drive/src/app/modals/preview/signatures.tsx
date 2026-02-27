import { c } from 'ttag';

import type { MaybeNode } from '@proton/drive';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { SignatureIcon } from '../../components/SignatureIcon';

/**
 * The method provides a label displayed to a user when there is a signature
 * issue regarding the content of a file that requires acknowledgement before
 * opening the preview.
 *
 * It checks the content author from the revision metadata and also the result
 * of the content itself.
 *
 * The label is not returned if the verification is not requested. It is
 * expected in some contexts to not have the possibility to access the public
 * keys, such as on a public page.
 */
export function getContentSignatureIssueLabel(
    verifyMetadataSignatures: boolean,
    node?: MaybeNode,
    hasContentSignatureIssues?: boolean
): string | undefined {
    if (!verifyMetadataSignatures) {
        return undefined;
    }

    if (hasContentSignatureIssues) {
        return c('Error').t`Data integrity check failed`;
    }

    if (!node) {
        return undefined;
    }

    const activeRevision = node.ok ? { ok: true, value: node.value.activeRevision } : node.error.activeRevision;

    // If the active revision is not ok, it means the node is not decryptable.
    // We can't check for signature issues in this case.
    if (!activeRevision || !activeRevision.ok || !activeRevision.value) {
        return undefined;
    }

    if (activeRevision.value.contentAuthor.ok) {
        return undefined;
    }

    return activeRevision.value?.contentAuthor.error.error;
}

export function SignatureStatus({ contentSignatureIssue }: { contentSignatureIssue?: string }) {
    if (!contentSignatureIssue) {
        return undefined;
    }

    return <SignatureIcon haveSignatureIssues={!!contentSignatureIssue} isFile={true} className="ml-2 color-danger" />;
}

export function SignatureInformation({ contentSignatureIssue }: { contentSignatureIssue?: string }) {
    if (!contentSignatureIssue) {
        return undefined;
    }

    return (
        <>
            {contentSignatureIssue}
            &nbsp;
            <a href={getKnowledgeBaseUrl('/drive-signature-management')} target="_blank">
                {c('Action').t`Learn more`}
            </a>
        </>
    );
}
