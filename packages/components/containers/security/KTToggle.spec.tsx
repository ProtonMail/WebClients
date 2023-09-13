import { fireEvent, render } from '@testing-library/react';

import { updateKT } from '@proton/shared/lib/api/mailSettings';
import { KEY_TRANSPARENCY_SETTING } from '@proton/shared/lib/interfaces';
import {
    applyHOCs,
    mockUseApi,
    mockUseEventManager,
    mockUseMailSettings,
    mockUseNotifications,
    withApi,
    withEventManager,
    withNotifications,
} from '@proton/testing';

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
