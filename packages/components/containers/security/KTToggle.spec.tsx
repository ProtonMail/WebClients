import { fireEvent, render } from '@testing-library/react';
import type { Mock } from 'vitest';

import { mockUseApi } from '@proton/app-context/testing/vitest/mockUseApi';
import { mockUseNotifications } from '@proton/app-context/testing/vitest/mockUseNotifications';
import { updateKT } from '@proton/shared/lib/api/mailSettings';
import { KEY_TRANSPARENCY_SETTING } from '@proton/shared/lib/mail/mailSettings';

import { applyHOCs } from '../../testing/hocs/helpers';
import { mockUseMailSettings } from '../../testing/vitest/mockUseMailSettings';
import { withApi } from '../../testing/vitest/with-api';
import { withEventManager } from '../../testing/vitest/with-event-manager';
import { withReduxStore } from '../../testing/vitest/with-redux-store';
import { withNotifications } from '../../testing/with-notifications';
import KTToggle from './KTToggle';

const KTToggleContext = applyHOCs(withApi(), withEventManager(), withNotifications(), withReduxStore())(KTToggle);

describe('KTToggle', () => {
    let mockedApi: Mock;

    beforeEach(() => {
        mockedApi = vi.fn();

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
