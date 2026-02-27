import { c } from 'ttag';

import type { MaybeNode } from '@proton/drive';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { SignatureIcon } from '../../components/SignatureIcon';

export function getContentSignatureIssue(
    verifyMetadataSignatures: boolean,
    node?: MaybeNode,
    hasContentSignatureIssues?: boolean
): string | undefined {
    if (hasContentSignatureIssues) {
        return c('Error').t`Data integrity check failed`;
    }

    if (!verifyMetadataSignatures || !node) {
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
