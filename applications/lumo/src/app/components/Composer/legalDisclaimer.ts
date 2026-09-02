interface LegalDisclaimerConditions {
    canShowLegalDisclaimer: boolean;
    /** False when the native mobile composer replaces the web one, and shows its own disclaimer. */
    canShowWebComposer: boolean;
    isEditorFocused: boolean;
    isEditorEmpty: boolean;
}

export const shouldShowLegalDisclaimer = ({
    canShowLegalDisclaimer,
    canShowWebComposer,
    isEditorFocused,
    isEditorEmpty,
}: LegalDisclaimerConditions): boolean =>
    canShowLegalDisclaimer && canShowWebComposer && !isEditorFocused && isEditorEmpty;
