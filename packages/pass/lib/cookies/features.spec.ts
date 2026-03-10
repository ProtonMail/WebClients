import type { PassFeature } from '@proton/pass/types/api/features';
import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';

import { getFeaturesFromCookie, updateFeatureVariantCookie } from './features';

jest.mock('@proton/shared/lib/helpers/cookies');
jest.mock('@proton/shared/lib/date-fns-utc', () => ({
    addDays: jest.fn((date) => date),
    endOfDay: jest.fn((date) => date),
}));

const mockGetCookie = getCookie as jest.MockedFunction<typeof getCookie>;
const mockSetCookie = setCookie as jest.MockedFunction<typeof setCookie>;

describe('getFeaturesFromCookie', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return empty object when cookie is not set', () => {
        mockGetCookie.mockReturnValue(undefined);
        expect(getFeaturesFromCookie()).toEqual({});
    });

    it('should parse single feature flag from cookie', () => {
        mockGetCookie.mockReturnValue('FeatureA:VariantA');
        expect(getFeaturesFromCookie()).toEqual({
            FeatureA: 'VariantA',
        });
    });

    it('should parse multiple feature flags from cookie', () => {
        mockGetCookie.mockReturnValue('FeatureA:VariantA,FeatureB:VariantB,FeatureC:VariantC');
        expect(getFeaturesFromCookie()).toEqual({
            FeatureA: 'VariantA',
            FeatureB: 'VariantB',
            FeatureC: 'VariantC',
        });
    });

    it('should filter out malformed entries', () => {
        mockGetCookie.mockReturnValue('FeatureA:VariantA,:VariantB,FeatureC:,MalformedEntry');
        expect(getFeaturesFromCookie()).toEqual({
            FeatureA: 'VariantA',
        });
    });

    it('should return empty object when getCookie throws error', () => {
        mockGetCookie.mockImplementation(() => {
            throw new Error('Cookie error');
        });
        expect(getFeaturesFromCookie()).toEqual({});
    });
});

describe('updateFeatureVariantCookie', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        ['flag name contains comma', 'Feature,Name', 'Variant'],
        ['flag name contains colon', 'Feature:Name', 'Variant'],
        ['flag name contains space', 'Feature Name', 'Variant'],
        ['variant contains comma', 'Feature', 'Variant,A'],
        ['variant contains colon', 'Feature', 'Variant:A'],
        ['variant contains space', 'Feature', 'Variant A'],
    ])('should not set cookie when %s', (_, flagName, variant) => {
        mockGetCookie.mockReturnValue('');

        updateFeatureVariantCookie(flagName as PassFeature, variant);

        expect(mockSetCookie).not.toHaveBeenCalled();
    });

    it('should set cookie with single feature flag', () => {
        mockGetCookie.mockReturnValue('');

        updateFeatureVariantCookie('Feature' as PassFeature, 'Variant');

        expect(mockSetCookie).toHaveBeenCalledWith(
            expect.objectContaining({
                cookieValue: 'Feature:Variant',
            })
        );
    });

    it('should merge with existing feature flags', () => {
        mockGetCookie.mockReturnValue('ExistingFeature:ExistingVariant');

        updateFeatureVariantCookie('NewFeature' as PassFeature, 'NewVariant');

        const cookieValue = mockSetCookie.mock.calls[0][0].cookieValue;
        expect(cookieValue).toBe('ExistingFeature:ExistingVariant,NewFeature:NewVariant');
    });

    it('should update existing feature flag variant', () => {
        mockGetCookie.mockReturnValue('FeatureA:VariantA,FeatureB:VariantB');

        updateFeatureVariantCookie('FeatureA' as PassFeature, 'NewVariantA');

        const cookieValue = mockSetCookie.mock.calls[0][0].cookieValue;
        expect(cookieValue).toContain('FeatureA:NewVariantA');
        expect(cookieValue).toContain('FeatureB:VariantB');
        expect(cookieValue).not.toContain('FeatureA:VariantA');
    });
});
