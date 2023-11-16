import { fireEvent, screen } from '@testing-library/dom';

import { ImportProvider, ImportType, NEW_EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import { easySwitchRender } from '@proton/activation/src/tests/render';

import OAuthImportButton from './OAuthImportButton';

describe('Test correct rendering of loading importer', () => {
    it('Should render importer', () => {
        easySwitchRender(
            <OAuthImportButton
                source={NEW_EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS}
                defaultCheckedTypes={[ImportType.MAIL]}
                displayOn="GoogleCalendar"
                provider={ImportProvider.GOOGLE}
            />
        );

        const button = screen.getByTestId('OAuthImportButton:button:google');
        fireEvent.click(button);
    });
});
