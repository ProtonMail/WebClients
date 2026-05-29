/**
 * Resolves whether Lumo's animated background should render.
 *
 * - OS reduce motion always wins (not overridable).
 * - An explicit Lumo preference overrides the account default.
 * - Otherwise inherits account "Disable animations" (`information.features.animations`).
 */
export const resolveAnimatedBackgroundEnabled = ({
    accountAnimationsDisabled,
    osReduceMotion,
    lumoAnimatedBackgroundEnabled,
}: {
    accountAnimationsDisabled: boolean;
    osReduceMotion: boolean;
    lumoAnimatedBackgroundEnabled?: boolean;
}): boolean => {
    if (osReduceMotion) {
        return false;
    }

    if (lumoAnimatedBackgroundEnabled != null) {
        return lumoAnimatedBackgroundEnabled;
    }

    return !accountAnimationsDisabled;
};
