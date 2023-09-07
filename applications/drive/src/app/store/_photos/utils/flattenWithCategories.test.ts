import { fromUnixTime, getUnixTime } from 'date-fns';

import { PhotoLink } from '../interface';
import { flattenWithCategories } from './flattenWithCategories';

jest.mock('@proton/shared/lib/i18n', () => ({
    dateLocale: {
        code: 'en-US',
        formatLong: {
            time: jest.fn(),
        },
    },
}));
describe('flattenWithCategories()', () => {
    beforeAll(() => {
        const unixDate = 1694096758; // Thu Sep 07 14:25:58 2023 UTC
        jest.useFakeTimers().setSystemTime(fromUnixTime(unixDate));
    });
    afterAll(() => {
        jest.useRealTimers();
    });
    it('should return flatten list with categories of photos', () => {
        const photos: PhotoLink[] = [
            {
                linkId: '32dsdj3h21dskjahdsahj32ewjkdah',
                activeRevision: {
                    photo: {
                        linkId: '32dsdj3h21dskjahdsahj32ewjkdah',
                        captureTime: getUnixTime(new Date()), // Today
                    },
                },
            },
            {
                linkId: 'ewqweqw324423ewrdshkhdsfsdff',
                activeRevision: {
                    photo: {
                        linkId: 'ewqweqw324423ewrdshkhdsfsdff',
                        captureTime: 1688731320, // 07/07/2023
                    },
                },
            },
            {
                linkId: '32432rewhjr342rew86t23rgdjsgf32tdwgu',
                activeRevision: {
                    photo: {
                        linkId: '32432rewhjr342rew86t23rgdjsgf32tdwgu',
                        captureTime: 1651924920, // 07/05/2023
                    },
                },
            },
            {
                linkId: '32432rewhjr342rew86t23rgdjsgf32tdwgu',
                activeRevision: {
                    photo: undefined, // Item that is not photo should be ignored
                },
            },
        ];
        const flattenPhotos = flattenWithCategories(photos);

        expect(flattenPhotos).toEqual(['Today', photos[0], 'July', photos[1], 'May 2022', photos[2]]);
    });
});
