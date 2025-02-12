import { fireEvent, render } from '@testing-library/react';

import { updateKT } from '@proton/shared/lib/api/mailSettings';
import { KEY_TRANSPARENCY_SETTING } from '@proton/shared/lib/mail/mailSettings';
import { applyHOCs, withApi, withEventManager, withNotifications, withReduxStore } from '@proton/testing';
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
