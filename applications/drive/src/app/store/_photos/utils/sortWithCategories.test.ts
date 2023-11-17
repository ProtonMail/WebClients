import { fromUnixTime, getUnixTime } from 'date-fns';

import { PhotoLink } from '../interface';
import { sortWithCategories } from './sortWithCategories';

jest.mock('@proton/shared/lib/i18n', () => ({
    dateLocale: {
        code: 'en-US',
        formatLong: {
            time: jest.fn(),
        },
    },
}));

describe('sortWithCategories', () => {
    beforeAll(() => {
        const unixDate = 1694096758; // Thu Sep 07 14:25:58 2023 UTC
        jest.useFakeTimers().setSystemTime(fromUnixTime(unixDate));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    const makeLink = (linkId: string | number, name: string, captureTime: number): PhotoLink => ({
        parentLinkId: '',
        rootShareId: '',
        isFile: true,
        linkId: `${linkId}`,
        name,
        activeRevision: {
            photo: {
                linkId: `${linkId}`,
                captureTime,
            },
        },
    });

    it('should return sorted list with categories of photos', () => {
        let linkId = 1;

        const photos: PhotoLink[] = [
            makeLink(linkId++, 'This month', getUnixTime(new Date())),
            makeLink(linkId++, '8 March 2022', 1646743628),
            makeLink(linkId++, '7 July 2023', 1688731320),
            makeLink(linkId++, '7 May 2023', 1651924920),
        ];
        const flattenPhotos = sortWithCategories([...photos]); // Destructure to keep origin reference

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
