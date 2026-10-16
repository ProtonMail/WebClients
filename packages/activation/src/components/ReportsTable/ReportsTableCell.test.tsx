import { screen } from '@testing-library/dom';

import { ApiImportProvider } from '../../api/api.interface';
import { ImportType } from '../../interface';
import { easySwitchRender } from '../../tests/render';
import ReportsTableCell from './ReportsTableCell';

const renderCell = (importerDate?: number) =>
    easySwitchRender(
        <table>
            <tbody>
                <tr>
                    <ReportsTableCell
                        provider={ApiImportProvider.GOOGLE}
                        product={ImportType.MAIL}
                        title="jane@gmail.com"
                        importerDate={importerDate}
                    />
                </tr>
            </tbody>
        </table>
    );

describe('ReportsTableCell', () => {
    it('Should display the date after a separator', () => {
        renderCell(1700000000);

        const time = document.querySelector('time');
        expect(time).not.toBeNull();
        expect(time?.textContent).toMatch(/^ - .+/);
    });

    it('Should not display a date or a separator without a date', () => {
        renderCell(undefined);

        screen.getByText('jane@gmail.com');
        expect(document.querySelector('time')).toBeNull();
    });
});
