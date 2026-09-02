import { shouldShowLegalDisclaimer } from './legalDisclaimer';

const conditions = {
    canShowLegalDisclaimer: true,
    canShowWebComposer: true,
    isEditorFocused: false,
    isEditorEmpty: true,
};

describe('shouldShowLegalDisclaimer', () => {
    it('shows the disclaimer above an untouched web composer', () => {
        expect(shouldShowLegalDisclaimer(conditions)).toBe(true);
    });

    it('hides the disclaimer when the native composer replaces the web one', () => {
        expect(shouldShowLegalDisclaimer({ ...conditions, canShowWebComposer: false })).toBe(false);
    });

    it('hides the disclaimer while the guest is typing', () => {
        expect(shouldShowLegalDisclaimer({ ...conditions, isEditorFocused: true })).toBe(false);
        expect(shouldShowLegalDisclaimer({ ...conditions, isEditorEmpty: false })).toBe(false);
    });

    it('hides the disclaimer where the caller does not allow it', () => {
        expect(shouldShowLegalDisclaimer({ ...conditions, canShowLegalDisclaimer: false })).toBe(false);
    });
});
