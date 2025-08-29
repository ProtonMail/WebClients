import { type MaybeNode } from '@proton/drive';

export type SignatureIssuesResult =
    | { ok: true }
    | {
          ok: false;
          issues: {
              keyAuthor: boolean;
              nameAuthor: boolean;
              contentAuthor: boolean;
          };
      };

/**
 * Checks for signature verification issues in a node.
 * Returns success for anonymous nodes as we can't verify the signature author.
 */
export function getSignatureIssues(node: MaybeNode): SignatureIssuesResult {
    const nodeEntity = node.ok ? node.value : node.error;

    let activeRevision;
    if (node.ok) {
        activeRevision = node.value.activeRevision;
    } else if (node.error.activeRevision?.ok) {
        activeRevision = node.error.activeRevision.value;
    } else {
        activeRevision = undefined;
    }

    const hasKeyIssues = !nodeEntity.keyAuthor.ok;
    const hasNameIssues = !nodeEntity.nameAuthor.ok;
    const hasContentIssues = Boolean(activeRevision && !activeRevision.contentAuthor.ok);

    const hasAnyIssues = hasKeyIssues || hasNameIssues || hasContentIssues;

    if (hasAnyIssues) {
        return {
            ok: false,
            issues: {
                keyAuthor: hasKeyIssues,
                nameAuthor: hasNameIssues,
                contentAuthor: hasContentIssues,
            },
        };
    }

    return {
        ok: true,
    };
}
