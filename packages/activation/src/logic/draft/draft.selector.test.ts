import { ImportProvider, ImportType } from '@proton/activation/src/interface';

import type { EasySwitchState } from '../store';
import { selectDraftModal } from './draft.selector';

const BASE_STATE: Omit<EasySwitchState, 'oauthDraft' | 'imapDraft'> = {
    importers: { importers: {}, activeImporters: {}, loading: 'idle' },
    reports: { reports: {}, summaries: {}, loading: 'idle' },
    sync: { syncs: {}, listLoading: 'idle', creatingLoading: 'idle' },
};

describe('EasySwitch draft selectors', () => {
    describe('SelectDraftModal', () => {
        it('Should return null when idle', () => {
            const state: EasySwitchState = {
                ...BASE_STATE,
                oauthDraft: {
                    step: 'idle',
                },
                imapDraft: {
                    step: 'idle',
                },
            };
            expect(selectDraftModal(state)).toEqual(null);
        });

        it('Should return null if imap and oauth started', () => {
            const state: EasySwitchState = {
                ...BASE_STATE,
                oauthDraft: {
                    step: 'started',
                },
                imapDraft: {
                    step: 'started',
                },
            };
            expect(selectDraftModal(state)).toEqual(null);
        });

        it('Should return "select-product" when start', () => {
            const state: EasySwitchState = {
                ...BASE_STATE,
                oauthDraft: {
                    step: 'idle',
                },
                imapDraft: {
                    step: 'started',
                    provider: ImportProvider.DEFAULT,
                    hasReadInstructions: false,
                },
            };
            expect(selectDraftModal(state)).toEqual('select-product');
        });

        it('Should return "select-product" when start', () => {
            const state: EasySwitchState = {
                ...BASE_STATE,
                oauthDraft: {
                    step: 'idle',
                },
                imapDraft: {
                    step: 'started',
                    provider: ImportProvider.DEFAULT,
                    product: ImportType.MAIL,
                    hasReadInstructions: false,
                },
            };
            expect(selectDraftModal(state)).toEqual('read-instructions');
        });

        it('Should return "import-{type}" when start import email', () => {
            const state: EasySwitchState = {
                ...BASE_STATE,
                oauthDraft: {
                    step: 'idle',
                },
                imapDraft: {
                    step: 'started',
                    provider: ImportProvider.DEFAULT,
                    product: ImportType.MAIL,
                    hasReadInstructions: true,
                },
            };
            expect(selectDraftModal(state)).toEqual('import-Mail');

            const state2: EasySwitchState = {
                ...BASE_STATE,
                oauthDraft: {
                    step: 'idle',
                },
                imapDraft: {
                    step: 'started',
                    provider: ImportProvider.DEFAULT,
                    product: ImportType.CALENDAR,
                    hasReadInstructions: true,
                },
            };
            expect(selectDraftModal(state2)).toEqual('import-Calendar');

            const state3: EasySwitchState = {
                ...BASE_STATE,
                oauthDraft: {
                    step: 'idle',
                },
                imapDraft: {
                    step: 'started',
                    provider: ImportProvider.DEFAULT,
                    product: ImportType.CONTACTS,
                    hasReadInstructions: true,
                },
            };
            expect(selectDraftModal(state3)).toEqual('import-Contacts');
        });

        it('Should return "oauth" when selecting OAuth import', () => {
            const state: EasySwitchState = {
                ...BASE_STATE,
                oauthDraft: {
                    step: 'started',
                    mailImport: {
                        products: [ImportType.MAIL, ImportType.CALENDAR],
                    },
                    provider: ImportProvider.GOOGLE,
                },
                imapDraft: {
                    step: 'idle',
                },
            };
            expect(selectDraftModal(state)).toEqual('oauth');
        });
    });
});
