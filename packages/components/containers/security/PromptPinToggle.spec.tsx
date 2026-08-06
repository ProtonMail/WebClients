import { fireEvent, render } from '@testing-library/react';

import { updatePromptPin } from '@proton/shared/lib/api/mailSettings';
import { applyHOCs } from '@proton/testing/lib/context/hocs/helpers';
import { withApi } from '@proton/testing/lib/context/hocs/with-api';
import { withEventManager } from '@proton/testing/lib/context/hocs/with-event-manager';
import { withNotifications } from '@proton/testing/lib/context/hocs/with-notifications';
import { withReduxStore } from '@proton/testing/lib/context/hocs/with-redux-store';
import { mockUseApi } from '@proton/testing/lib/mockUseApi';
import { mockUseMailSettings } from '@proton/testing/lib/mockUseMailSettings';
import { mockUseNotifications } from '@proton/testing/lib/mockUseNotifications';

import PromptPinToggle from './PromptPinToggle';

const PromptPinToggleContext = applyHOCs(
    withApi(),
    withEventManager(),
    withNotifications(),
    withReduxStore()
)(PromptPinToggle);

describe('PromptPinToggle', () => {
    let mockedApi: jest.Mock;

    beforeEach(() => {
        mockedApi = jest.fn();

        mockUseApi(mockedApi);

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
            mockedApi.mockResolvedValue({
                MailSettings: {
                    PromptPin: 1,
                },
            });
            fireEvent.click(toggle);
            expect(mockedApi).toHaveBeenCalledWith(updatePromptPin(1));
        });
    });
});
