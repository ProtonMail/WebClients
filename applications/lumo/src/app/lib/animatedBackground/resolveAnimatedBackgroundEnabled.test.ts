import { resolveAnimatedBackgroundEnabled } from './resolveAnimatedBackgroundEnabled';

describe('resolveAnimatedBackgroundEnabled', () => {
    it('disables when OS reduce motion is enabled', () => {
        expect(
            resolveAnimatedBackgroundEnabled({
                accountAnimationsDisabled: false,
                osReduceMotion: true,
                lumoAnimatedBackgroundEnabled: true,
            })
        ).toBe(false);
    });

    it('inherits account setting when Lumo preference is unset', () => {
        expect(
            resolveAnimatedBackgroundEnabled({
                accountAnimationsDisabled: true,
                osReduceMotion: false,
            })
        ).toBe(false);

        expect(
            resolveAnimatedBackgroundEnabled({
                accountAnimationsDisabled: false,
                osReduceMotion: false,
            })
        ).toBe(true);
    });

    it('allows Lumo to override account disable', () => {
        expect(
            resolveAnimatedBackgroundEnabled({
                accountAnimationsDisabled: true,
                osReduceMotion: false,
                lumoAnimatedBackgroundEnabled: true,
            })
        ).toBe(true);
    });

    it('allows Lumo to disable independently of account', () => {
        expect(
            resolveAnimatedBackgroundEnabled({
                accountAnimationsDisabled: false,
                osReduceMotion: false,
                lumoAnimatedBackgroundEnabled: false,
            })
        ).toBe(false);
    });
});
