import { fireEvent, render } from '@testing-library/react';

import { mockUseNotifications } from '@proton/app-context/testing/vitest/mockUseNotifications';
import { KEY_TRANSPARENCY_SETTING } from '@proton/shared/lib/mail/mailSettings';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/vitest/api';

import { applyHOCs } from '../../testing/hocs/helpers';
import { mockUseMailSettings } from '../../testing/vitest/mockUseMailSettings';
import { withApi } from '../../testing/vitest/with-api';
import { withEventManager } from '../../testing/vitest/with-event-manager';
import { withReduxStore } from '../../testing/vitest/with-redux-store';
import { withNotifications } from '../../testing/with-notifications';
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
