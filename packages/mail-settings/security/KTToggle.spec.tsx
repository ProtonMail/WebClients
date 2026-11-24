import { fireEvent, render } from '@testing-library/react';

import { mockUseNotifications } from '@proton/app-context/testing/mockUseNotifications';
import { applyHOCs } from '@proton/components/testing/hocs/helpers';
import { mockUseMailSettings } from '@proton/components/testing/mockUseMailSettings';
import { withApi } from '@proton/components/testing/with-api';
import { withEventManager } from '@proton/components/testing/with-event-manager';
import { withNotifications } from '@proton/components/testing/with-notifications';
import { withReduxStore } from '@proton/components/testing/with-redux-store';
import { KEY_TRANSPARENCY_SETTING } from '@proton/shared/lib/mail/mailSettings';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/vitest/api';

import KTToggle from './KTToggle';

const KTToggleContext = applyHOCs(withApi(), withEventManager(), withNotifications(), withReduxStore())(KTToggle);

describe('KTToggle', () => {
    beforeEach(() => {
        apiMock.mockClear();
        addApiMock('mail/v4/settings/kt', () => ({ MailSettings: { KT: KEY_TRANSPARENCY_SETTING.ENABLED } }), 'put');

        mockUseMailSettings();
        mockUseNotifications();
    });

    afterEach(() => {
        clearApiMocks();
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
            expect(apiMock).toHaveBeenCalledWith({
                url: 'mail/v4/settings/kt',
                method: 'put',
                data: { KT: KEY_TRANSPARENCY_SETTING.ENABLED },
            });
        });
    });
});
