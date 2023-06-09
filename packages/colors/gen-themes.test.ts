import { describe, jest } from '@jest/globals';
import fs from 'fs';

import { main } from './gen-themes';
import config from './themes.config';

jest.mock('fs');

const mockFS = <jest.Mocked<typeof fs>>fs;

describe('genThemes', () => {
    it('generates the necessary shades for a button', () => {
        mockFS.writeFileSync = jest.fn();
        // @ts-ignore
        mockFS.readFileSync = jest.requireActual<typeof fs>('fs').readFileSync;
        main(config[0]);
        expect(mockFS.writeFileSync).toHaveBeenCalledTimes(1);
        expect(mockFS.writeFileSync).toHaveBeenCalledWith(
            './themes/dist/snow.theme.css',
            expect.stringContaining(':root,\n' + '.ui-standard {\n' + '  --primary: #6d4aff;')
        );
    });
});
