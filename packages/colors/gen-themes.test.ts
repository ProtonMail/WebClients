import { describe, jest } from '@jest/globals';
import fs from 'fs';

import { main } from './gen-themes';
import config from './themes.config';

describe('genThemes', () => {
    it('generates the necessary shades for a button', async () => {
        jest.spyOn(fs, 'writeFileSync');
        await main(config[0]);
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            './themes/dist/snow.theme.css',
            expect.stringContaining(':root,\n' + '.ui-standard {\n' + '  --primary: #6d4aff;')
        );
    });
});
