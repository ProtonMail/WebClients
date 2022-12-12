import { createSelector } from '@reduxjs/toolkit';

import { ImportType } from '@proton/activation/interface';

import { EasySwitchState } from '../store';

const selectImapDraft = (state: EasySwitchState) => state.imapDraft;
const selectOauthDraft = (state: EasySwitchState) => state.oauthDraft;

type DraftModal = 'select-product' | `import-${ImportType}` | 'read-instructions' | 'oauth' | null;
export const selectDraftModal = createSelector(
    selectImapDraft,
    selectOauthDraft,
    (imapDraft, oauthDraft): DraftModal => {
        /**
         * We don't display modal if:
         * - both imap and oauth draft steps are idle,
         * - both imap and oauth draft steps are started (not idle)
         */
        if (
            (imapDraft.step === 'idle' && oauthDraft.step === 'idle') ||
            (imapDraft.step !== 'idle' && oauthDraft.step !== 'idle')
        ) {
            return null;
        }

        /**
         * We consider a draft as started if it's not idle.
         */
        if (imapDraft.step !== 'idle') {
            if (!imapDraft.product) {
                return 'select-product';
            }

            if (!imapDraft.hasReadInstructions) {
                return 'read-instructions';
            }

            if (imapDraft.product) {
                return `import-${imapDraft.product}`;
            }
        }

        /**
         * We consider a draft as started if it's not idle.
         */
        if (oauthDraft.step !== 'idle') {
            return 'oauth';
        }

        return null;
    }
);
