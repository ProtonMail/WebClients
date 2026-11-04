/** @jest-environment-options {"url":"https://lumo.proton.me"} */
import { act, render } from '@testing-library/react';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import NotificationPanel from './NotificationPanel';

jest.mock('../../hooks/useLumoFlags');

describe('native composer notification layout', () => {
    afterEach(() => jest.useRealTimers());

    it.each([
        ['iPhone', 'ProtonLumo/2.2.0 (iOS 27.2; Apple iPhone)', true, true],
        ['iPad', 'ProtonLumo/2.2.0 (iPadOS 27.2; Apple iPad)', true, true],
        ['older iPad', 'ProtonLumo/2.1.3 (iPadOS 27.2; Apple iPad)', true, false],
        ['Android', 'ProtonLumo/2.1.0 (Android 16; Pixel)', true, true],
        ['flag off', 'ProtonLumo/2.2.0 (iPadOS 27.2; Apple iPad)', false, false],
        ['browser', 'Mozilla/5.0', true, false],
    ])('keeps the panel clear of the selected composer on %s', (_name, userAgent, enabled, native) => {
        Object.defineProperty(navigator, 'userAgent', { configurable: true, value: userAgent });
        (useLumoFlags as jest.Mock).mockReturnValue({ nativeComposer: enabled });
        jest.useFakeTimers();
        const { container } = render(<NotificationPanel title="QA" />);
        act(() => jest.runOnlyPendingTimers());
        expect(container.querySelector('.notification-panel')).not.toBeNull();
        expect(
            container.querySelector('.notification-panel')?.classList.contains('notification-panel--native-composer')
        ).toBe(native);
    });
});
