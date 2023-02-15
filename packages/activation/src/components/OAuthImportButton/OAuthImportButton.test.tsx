import { fireEvent, screen } from '@testing-library/dom';

import { EASY_SWITCH_SOURCE, ImportType } from '@proton/activation/src/interface';
import { easySwitchRender } from '@proton/activation/src/tests/render';

import OAuthImportButton from './OAuthImportButton';

describe('Test correct rendering of loading importer', () => {
    it('Should render importer', () => {
        easySwitchRender(
            <OAuthImportButton
                source={EASY_SWITCH_SOURCE.EASY_SWITCH_SETTINGS}
                defaultCheckedTypes={[ImportType.MAIL]}
                displayOn="GoogleCalendar"
            />
        );

        const button = screen.getByTestId('OAuthImportButton:button');
        fireEvent.click(button);
    });
});
