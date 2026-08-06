import { fireEvent, render } from '@testing-library/react';

import { updateKT } from '@proton/shared/lib/api/mailSettings';
import { KEY_TRANSPARENCY_SETTING } from '@proton/shared/lib/mail/mailSettings';
import { applyHOCs } from '@proton/testing/lib/context/hocs/helpers';
import { withApi } from '@proton/testing/lib/context/hocs/with-api';
import { withEventManager } from '@proton/testing/lib/context/hocs/with-event-manager';
import { withNotifications } from '@proton/testing/lib/context/hocs/with-notifications';
import { withReduxStore } from '@proton/testing/lib/context/hocs/with-redux-store';
import { mockUseApi } from '@proton/testing/lib/mockUseApi';
import { mockUseMailSettings } from '@proton/testing/lib/mockUseMailSettings';
import { mockUseNotifications } from '@proton/testing/lib/mockUseNotifications';

import KTToggle from './KTToggle';

const KTToggleContext = applyHOCs(withApi(), withEventManager(), withNotifications(), withReduxStore())(KTToggle);

describe('KTToggle', () => {
    let mockedApi: jest.Mock;

    beforeEach(() => {
        mockedApi = jest.fn();

        mockUseApi(mockedApi);

        mockUseMailSettings();
        mockUseNotifications();
    });

    const setup = () => {
        const utils = render(<KTToggleContext />);
        return {
            ...utils,
        };
    };

    describe('when we toggle the component', () => {
        it('should call the API', () => {
            const { getByRole } = setup();
            const toggle = getByRole('checkbox');
            mockedApi.mockResolvedValue({
                MailSettings: {
                    KeyTransparency: KEY_TRANSPARENCY_SETTING.ENABLED,
                },
            });
            fireEvent.click(toggle);
            expect(mockedApi).toHaveBeenCalledWith(updateKT(KEY_TRANSPARENCY_SETTING.ENABLED));
        });
    });
});
