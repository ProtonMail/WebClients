import { readFile } from 'fs/promises';

import { extractPrivateDomains } from '@proton/pass/lib/extension/tlds/parser';

describe('`extractPrivateDomains`', () => {
    test('should correctly extract private domains', async () => {
        const list = await readFile(`${__dirname}/public_suffix_list.mock.dat`, { encoding: 'utf-8' });
        const privateDomains = extractPrivateDomains(list);

        expect(privateDomains).toStrictEqual([
            'gitbook.io',
            'mypinata.cloud',
            'on-fleek.app',
            'weebly.com',
            'mystrikingly.com',
            'wordpress.com',
            'art.blog',
            'business.blog',
            'car.blog',
            'video.blog',
            'water.blog',
        ]);
    });
});
