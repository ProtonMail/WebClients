import { fireEvent, render } from '@testing-library/react';

import { mockUseNotifications } from '@proton/app-context/testing/mockUseNotifications';
import { applyHOCs } from '@proton/components/testing/hocs/helpers';
import { mockUseMailSettings } from '@proton/components/testing/mockUseMailSettings';
import { withApi } from '@proton/components/testing/with-api';
import { withEventManager } from '@proton/components/testing/with-event-manager';
import { withNotifications } from '@proton/components/testing/with-notifications';
import { withReduxStore } from '@proton/components/testing/with-redux-store';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/vitest/api';

import PromptPinToggle from './PromptPinToggle';

const PromptPinToggleContext = applyHOCs(
    withApi(),
    withEventManager(),
    withNotifications(),
    withReduxStore()
)(PromptPinToggle);

describe('PromptPinToggle', () => {
    beforeEach(() => {
        apiMock.mockClear();
        addApiMock('mail/v4/settings/promptpin', () => ({ MailSettings: { PromptPin: 1 } }), 'put');

        mockUseMailSettings();
        mockUseNotifications();
    });

    afterEach(() => {
        clearApiMocks();
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
            expect(apiMock).toHaveBeenCalledWith({
                url: 'mail/v4/settings/promptpin',
                method: 'put',
                data: { PromptPin: 1 },
            });
        });
    });
});
