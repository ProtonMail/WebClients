import { fireEvent, render } from '@testing-library/react';

import { updatePromptPin } from '@proton/shared/lib/api/mailSettings';
import { applyHOCs, withApi, withEventManager, withNotifications } from '@proton/testing';
import { mockUseApi } from '@proton/testing/lib/mockUseApi';
import { mockUseEventManager } from '@proton/testing/lib/mockUseEventManager';
import { mockUseMailSettings } from '@proton/testing/lib/mockUseMailSettings';
import { mockUseNotifications } from '@proton/testing/lib/mockUseNotifications';

import PromptPinToggle from './PromptPinToggle';

const PromptPinToggleContext = applyHOCs(withApi(), withEventManager(), withNotifications())(PromptPinToggle);

describe('PromptPinToggle', () => {
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
        const utils = render(<PromptPinToggleContext />);
        return {
            ...utils,
        };
    };

    describe('when we toggle the component', () => {
        it('should call the API', () => {
            const { getByRole } = setup();
            const toggle = getByRole('checkbox');
            fireEvent.click(toggle);
            expect(mockedApi).toHaveBeenCalledWith(updatePromptPin(1));
        });
    });
});
