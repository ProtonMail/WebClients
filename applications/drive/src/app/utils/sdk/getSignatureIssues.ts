import type { NodeEntity } from '@proton/drive';

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
export function getSignatureIssues(node: NodeEntity): SignatureIssuesResult {
    const activeRevision = node.activeRevision?.ok ? node.activeRevision.value : undefined;

    const hasKeyIssues = !node.keyAuthor.ok;
    const hasNameIssues = !node.nameAuthor.ok;
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
