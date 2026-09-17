import { fireEvent, render } from '@testing-library/react';

import { mockUseApi } from '@proton/app-context/testing/mockUseApi';
import { mockUseNotifications } from '@proton/app-context/testing/mockUseNotifications';
import { mockUseMailSettings } from '@proton/mail/testing/mockUseMailSettings';
import { updatePromptPin } from '@proton/shared/lib/api/mailSettings';

import { applyHOCs } from '../../testing/hocs/helpers';
import { withApi } from '../../testing/hocs/with-api';
import { withEventManager } from '../../testing/with-event-manager';
import { withNotifications } from '../../testing/with-notifications';
import { withReduxStore } from '../../testing/with-redux-store';
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
