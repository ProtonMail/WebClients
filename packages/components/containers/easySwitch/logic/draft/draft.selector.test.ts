import { EasySwitchState } from '../store';
import { ImportAuthType, ImportProvider, ImportType } from '../types/shared.types';
import { DraftStep } from './draft.interface';
import { selectDraftModal } from './draft.selector';

const BASE_STATE: Omit<EasySwitchState, 'draft'> = {
    importers: { importers: {}, activeImporters: {}, loading: 'idle' },
    reports: { reports: {}, summaries: {}, loading: 'idle' },
};

describe('EasySwitch draft selectors', () => {
    describe('SelectDraftModal', () => {
        it('Should return null when idle', () => {
            const state: EasySwitchState = {
                ...BASE_STATE,
                draft: {
                    ui: {
                        step: DraftStep.IDLE,
                    },
                },
            };
            expect(selectDraftModal(state)).toEqual(null);
        });

        it('Should return "select-product" when start', () => {
            const state: EasySwitchState = {
                ...BASE_STATE,
                draft: {
                    ui: {
                        step: DraftStep.START,
                        authType: ImportAuthType.IMAP,
                        provider: ImportProvider.DEFAULT,
                        hasReadInstructions: false,
                    },
                },
            };
            expect(selectDraftModal(state)).toEqual('select-product');
        });

        it('Should return "select-product" when start', () => {
            const state: EasySwitchState = {
                ...BASE_STATE,
                draft: {
                    ui: {
                        step: DraftStep.START,
                        authType: ImportAuthType.IMAP,
                        provider: ImportProvider.DEFAULT,
                        importType: ImportType.MAIL,
                        hasReadInstructions: false,
                    },
                },
            };
            expect(selectDraftModal(state)).toEqual('read-instructions');
        });

        it('Should return "import-{type}" when start import email', () => {
            const state: EasySwitchState = {
                ...BASE_STATE,
                draft: {
                    ui: {
                        step: DraftStep.START,
                        authType: ImportAuthType.IMAP,
                        provider: ImportProvider.DEFAULT,
                        importType: ImportType.MAIL,
                        hasReadInstructions: true,
                    },
                },
            };
            expect(selectDraftModal(state)).toEqual('import-Mail');

            const state2: EasySwitchState = {
                ...BASE_STATE,
                draft: {
                    ui: {
                        step: DraftStep.START,
                        authType: ImportAuthType.IMAP,
                        provider: ImportProvider.DEFAULT,
                        importType: ImportType.CALENDAR,
                        hasReadInstructions: true,
                    },
                },
            };
            expect(selectDraftModal(state2)).toEqual('import-Calendar');

            const state3: EasySwitchState = {
                ...BASE_STATE,
                draft: {
                    ui: {
                        step: DraftStep.START,
                        authType: ImportAuthType.IMAP,
                        provider: ImportProvider.DEFAULT,
                        importType: ImportType.CONTACTS,
                        hasReadInstructions: true,
                    },
                },
            };
            expect(selectDraftModal(state3)).toEqual('import-Contacts');
        });

        it('Should return "oauth" when selecting Oauth import', () => {
            const state3: EasySwitchState = {
                ...BASE_STATE,
                draft: {
                    ui: {
                        step: DraftStep.START,
                        authType: ImportAuthType.OAUTH,
                        provider: ImportProvider.GOOGLE,
                        hasReadInstructions: false,
                    },
                },
            };
            expect(selectDraftModal(state3)).toEqual('oauth');
        });
    });
});
