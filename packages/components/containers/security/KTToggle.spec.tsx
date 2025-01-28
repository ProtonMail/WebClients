import { fireEvent, render } from '@testing-library/react';

import { updateKT } from '@proton/shared/lib/api/mailSettings';
import { KEY_TRANSPARENCY_SETTING } from '@proton/shared/lib/mail/mailSettings';
import { applyHOCs, withApi, withEventManager, withNotifications } from '@proton/testing';
import { mockUseApi } from '@proton/testing/lib/mockUseApi';
import { mockUseEventManager } from '@proton/testing/lib/mockUseEventManager';
import { mockUseMailSettings } from '@proton/testing/lib/mockUseMailSettings';
import { mockUseNotifications } from '@proton/testing/lib/mockUseNotifications';

import KTToggle from './KTToggle';

const KTToggleContext = applyHOCs(withApi(), withEventManager(), withNotifications())(KTToggle);

describe('KTToggle', () => {
    let mockedApi: jest.Mock;
    let mockedCall: jest.Mock;

    beforeEach(() => {
        mockedApi = jest.fn();
        mockedCall = jest.fn();

        mockUseApi(mockedApi);
        mockUseEventManager({ call: mockedCall });

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
            fireEvent.click(toggle);
            expect(mockedApi).toHaveBeenCalledWith(updateKT(KEY_TRANSPARENCY_SETTING.ENABLED));
        });
    });
});
