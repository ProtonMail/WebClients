import { mockUseFeature } from './mockUseFeature';

describe('mockUseFeature', () => {
    it('changes what useFeature returns', async () => {
        mockUseFeature({ feature: { Value: true } });

        // Imported after the helper, which registers the vi.mock of this module.
        // eslint-disable-next-line custom-rules/no-package-self-import, proton/no-extraneous-dependencies -- same module identity as the helper
        const { default: useFeature } = await import('@proton/features/useFeature');
        const result = (useFeature as any)('SomeCode');

        expect(result.code).toBe('SomeCode');
        expect(result.feature.Value).toBe(true);
        expect(result.loading).toBe(false);
    });
});
