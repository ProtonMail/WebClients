import type { Result } from '@proton/pass/types';

export type InviteBatchResult = Result<{}, { failed: string[] }>;

export const concatInviteResults = (results: InviteBatchResult[]): InviteBatchResult =>
    results.reduce(
        (acc, result) => {
            if (result.ok) return acc;
            else {
                return {
                    ok: false,
                    failed: acc.ok ? result.failed : acc.failed.concat(result.failed),
                    error: acc.ok
                        ? result.error
                        : (() => {
                              if (!acc.error) return result.error;
                              if (!result.error) return acc.error;
                              return acc.error.includes(result.error)
                                  ? acc.error
                                  : acc.error.concat(`. ${result.error}`);
                          })(),
                };
            }
        },
        { ok: true }
    );
