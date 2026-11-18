import { fireEvent, render } from '@testing-library/react';
import type { Mock } from 'vitest';

import { mockUseApi } from '@proton/app-context/testing/vitest/mockUseApi';
import { mockUseNotifications } from '@proton/app-context/testing/vitest/mockUseNotifications';
import { updatePromptPin } from '@proton/shared/lib/api/mailSettings';

import { applyHOCs } from '../../testing/hocs/helpers';
import { mockUseMailSettings } from '../../testing/vitest/mockUseMailSettings';
import { withApi } from '../../testing/vitest/with-api';
import { withEventManager } from '../../testing/vitest/with-event-manager';
import { withReduxStore } from '../../testing/vitest/with-redux-store';
import { withNotifications } from '../../testing/with-notifications';
import PromptPinToggle from './PromptPinToggle';

const PromptPinToggleContext = applyHOCs(
    withApi(),
    withEventManager(),
    withNotifications(),
    withReduxStore()
)(PromptPinToggle);

describe('PromptPinToggle', () => {
    let mockedApi: Mock;

    beforeEach(() => {
        mockedApi = vi.fn();

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
