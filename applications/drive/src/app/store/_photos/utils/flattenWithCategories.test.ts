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
                linkId: '9d6c33a79feba8dd2fd768f58f450a7f2ff3ec2e',
                name: 'This month',
                activeRevision: {
                    photo: {
                        linkId: '9d6c33a79feba8dd2fd768f58f450a7f2ff3ec2e',
                        captureTime: getUnixTime(new Date()), // Today
                    },
                },
            },
            {
                linkId: '1a44a587ffbb4d38a04f68af1ddf6b30a74ff3b7',
                name: '8 March 2022',
                activeRevision: {
                    photo: {
                        linkId: '1a44a587ffbb4d38a04f68af1ddf6b30a74ff3b7',
                        captureTime: 1646743628, // 08/03/2022
                    },
                },
            },
            {
                linkId: '6d2a5651f974cc67d99cbdabd00560967a7bad10',
                name: '7 July 2023',
                activeRevision: {
                    photo: {
                        linkId: '6d2a5651f974cc67d99cbdabd00560967a7bad10',
                        captureTime: 1688731320, // 07/07/2023
                    },
                },
            },
            {
                linkId: '8ac290ecd3dcfe51ac2e81ba1dbbcc8b6a20b199',
                name: '7 May 2022',
                activeRevision: {
                    photo: {
                        linkId: '8ac290ecd3dcfe51ac2e81ba1dbbcc8b6a20b199',
                        captureTime: 1651924920, // 07/05/2022
                    },
                },
            },
        ];
        const flattenPhotos = flattenWithCategories([...photos]); // Destructure to keep origin reference

        expect(flattenPhotos).toEqual([
            'This month',
            photos[0],
            'July',
            photos[2],
            'May 2022',
            photos[3],
            'March 2022',
            photos[1],
        ]);
    });
});
