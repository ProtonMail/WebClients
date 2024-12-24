import { type Feature, FeatureCode } from '@proton/features/interface';
import { type FeaturesResponse, fetchFeatures } from '@proton/features/reducer';
import { DAY } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';

import { setupStore } from './tests/store';

const getMockFeature = (data: Pick<Feature, 'Code' | 'Value' | 'Type'> & Partial<Feature>): Feature => {
    return {
        ...data,
    } as Feature;
};

describe('reducer tests', () => {
    it('should return the initial state', async () => {
        const now = Date.now();
        jest.useFakeTimers({ now });

        const api = jest.fn<Promise<FeaturesResponse>, any>();
        const extraThunkArguments = { api: api as Api };
        const store = setupStore({ extraThunkArguments });

        const mockFeature = getMockFeature({
            Code: FeatureCode.EarlyAccessScope,
            Value: 'beta',
            Type: 'enumeration',
        });

        const validateResult = async (result: any) => {
            expect(store.getState()).toEqual(
                expect.objectContaining({
                    features: {
                        [mockFeature.Code]: {
                            value: mockFeature,
                            meta: expect.any(Object),
                        },
                    },
                })
            );
            expect(result).toEqual({ [mockFeature.Code]: mockFeature });
        };

        api.mockReturnValueOnce(Promise.resolve({ Features: [mockFeature] }));
        const result1 = await store.dispatch(fetchFeatures([FeatureCode.EarlyAccessScope]));
        await validateResult(result1);

        const result2 = await store.dispatch(fetchFeatures([FeatureCode.EarlyAccessScope]));
        await validateResult(result2);

        await jest.advanceTimersByTimeAsync(DAY * 3);

        const result3 = await store.dispatch(fetchFeatures([FeatureCode.EarlyAccessScope]));
        await validateResult(result3);

        expect(api).toHaveBeenCalledTimes(1);
    });

    it('should clear out archived features', async () => {
        const now = Date.now();
        jest.useFakeTimers({ now });

        const api = jest.fn<Promise<FeaturesResponse>, any>();
        const extraThunkArguments = { api: api as Api };
        const archivedFeature = getMockFeature({
            Code: FeatureCode.BlockSenderInToolbar,
            Value: true,
            Type: 'boolean',
        });
        const mockFeature1 = getMockFeature({
            Code: FeatureCode.EarlyAccessScope,
            Value: 'beta',
            Type: 'enumeration',
        });
        const store = setupStore({
            extraThunkArguments,
            preloadedState: {
                features: {
                    [archivedFeature.Code]: {
                        value: archivedFeature,
                        meta: { fetchedAt: 999, fetchedEphemeral: true },
                    },
                    [mockFeature1.Code]: {
                        value: mockFeature1,
                        meta: { fetchedAt: now, fetchedEphemeral: true },
                    },
                },
            },
        });

        const validateResult = async (result: any, mockFeature: Feature) => {
            expect(store.getState()).toEqual(
                expect.objectContaining({
                    features: {
                        [mockFeature.Code]: {
                            value: mockFeature,
                            meta: expect.any(Object),
                        },
                    },
                })
            );
            expect(result).toEqual({
                [mockFeature.Code]: mockFeature,
            });
        };

        const result1 = await store.dispatch(fetchFeatures([FeatureCode.EarlyAccessScope]));
        await validateResult(result1, mockFeature1);

        await jest.advanceTimersByTimeAsync(DAY * 14);

        const mockFeature2 = getMockFeature({
            Code: FeatureCode.EarlyAccessScope,
            Value: 'alpha',
            Type: 'enumeration',
        });
        api.mockReturnValueOnce(Promise.resolve({ Features: [mockFeature2] }));
        const result2 = await store.dispatch(fetchFeatures([FeatureCode.EarlyAccessScope]));
        await validateResult(result2, mockFeature2);

        expect(api).toHaveBeenCalledTimes(1);
    });
});
