import type { AdvancedSimpleFilterModalModel } from '@proton/components/containers/filters/interfaces';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';

/**
 * `mail/v4/filters/check` answers in CodeMirror's lint vocabulary — the advanced filter modal hands its
 * `Issues` straight to the Sieve editor's linter, so `from.line` is 0-based as the gutter needs it.
 * Taken through the filters interfaces, which already own that dependency.
 */
export type SieveIssue = AdvancedSimpleFilterModalModel['issues'][number];

const describeIssue = ({ from, message }: SieveIssue): string => {
    const lineLabel = `line ${from.line + 1}`;
    return message ? `${lineLabel}: ${message}` : lineLabel;
};

/** Without the backend's issues the model has nothing to correct, and re-sends the same script. */
export const assertSieveValid = (issues: SieveIssue[]): void => {
    if (!issues.length) {
        return;
    }

    throw new ToolInputError(
        `This Sieve script is invalid. Fix these and send it again — ${issues.map(describeIssue).join('; ')}`
    );
};
