import { fromUnixTime, getUnixTime } from 'date-fns';

import type { PhotoLink } from '../interface';
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

    const makeLink = (linkId: string | number, name: string, captureTime?: number, createTime?: number): PhotoLink => ({
        parentLinkId: '',
        rootShareId: '',
        isFile: true,
        linkId: `${linkId}`,
        name,
        activeRevision: {
            photo: {
                linkId: `${linkId}`,
                // @ts-ignore
                captureTime,
            },
        },
        // @ts-ignore
        createTime,
    });

    it('should return sorted list with categories of photos', () => {
        let linkId = 1;

        const photos: PhotoLink[] = [
            makeLink(linkId++, 'This month', getUnixTime(new Date())),
            makeLink(linkId++, '8 March 2022', 1646743628),
            makeLink(linkId++, '7 July 2023', 1688731320),
            makeLink(linkId++, '7 May 2023', 1651924920),
        ];
        const flattenPhotos = sortWithCategories([...photos]);

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

    it('should handle items without captureTime', () => {
        let linkId = 1;

        const photos: PhotoLink[] = [
            makeLink(linkId++, 'This month', getUnixTime(new Date())),
            makeLink(linkId++, '8 March 2022', undefined, 1646743628),
            makeLink(linkId++, '7 July 2023', 1688731320),
            makeLink(linkId++, '7 May 2023', undefined, 1651924920),
        ];
        const flattenPhotos = sortWithCategories([...photos]);

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

    it('should handle items without captureTime and without createTime', () => {
        let linkId = 1;

        const photos: PhotoLink[] = [
            makeLink(linkId++, 'This month', getUnixTime(new Date())),
            makeLink(linkId++, '8 March 2022', undefined, 1646743628),
            makeLink(linkId++, '?', undefined, undefined),
            makeLink(linkId++, '7 May 2023', 1651924920),
        ];
        const flattenPhotos = sortWithCategories([...photos]); // Destructure to keep origin reference

        expect(flattenPhotos).toEqual([
            'This month',
            photos[0],
            'May 2022',
            photos[3],
            'March 2022',
            photos[1],
            'Unknown date',
            photos[2],
        ]);
    });

    it('should handle items with invalid timestamps gracefully', () => {
        let linkId = 1;
        const photos: PhotoLink[] = [
            makeLink(linkId++, 'This month', getUnixTime(new Date())),
            makeLink(linkId++, 'NaN timestamp', NaN as any, undefined),
            makeLink(linkId++, 'Infinity timestamp', Infinity as any, undefined),
            makeLink(linkId++, '7 July 2023', 1688731320),
            makeLink(linkId++, 'Negative timestamp', -100 as any, undefined),
            makeLink(linkId++, 'Null timestamp', null as any, undefined),
            makeLink(linkId++, '1.844674407e22', 1.844674407e22 as any, undefined),
        ];

        const flattenPhotos = sortWithCategories([...photos]);

        expect(flattenPhotos).toEqual([
            'Unknown date',
            photos[2],
            photos[6],
            'This month',
            photos[0],
            'July',
            photos[3],
            'Unknown date',
            photos[1],
            photos[4],
            photos[5],
        ]);
    });
});
