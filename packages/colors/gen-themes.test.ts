import fs from 'fs';
import { describe, expect, it, vi } from 'vitest';

import { main } from './gen-themes';
import config from './themes.config';

describe('genThemes', () => {
    it('generates the necessary shades for a button', async () => {
        vi.spyOn(fs, 'writeFileSync');
        await main(config[0]);
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            './themes/dist/snow.theme.css',
            expect.stringContaining(':root,\n' + '.ui-standard {\n' + '  --primary-minor-2: #f0edff;')
        );
    });
});
