/** @jest-environment-options {"url":"https://lumo.proton.me"} */
import { render } from '@testing-library/react';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { ComposerNotificationCard } from './ComposerNotificationCard';

jest.mock('../../hooks/useLumoFlags');

describe('native composer cards', () => {
    it.each([
        ['iPhone', 'ProtonLumo/2.2.0 (iOS 27.2; Apple iPhone)', true, 'flex-column', 'shrink-0'],
        ['iPad', 'ProtonLumo/2.2.0 (iPadOS 27.2; Apple iPad)', true, 'flex-column', 'shrink-0'],
        ['older iPad', 'ProtonLumo/2.1.3 (iPadOS 27.2; Apple iPad)', true, 'flex-row', 'flex-1'],
        ['Android', 'ProtonLumo/2.1.0 (Android 16; Pixel)', true, 'flex-column', 'shrink-0'],
        ['flag off', 'ProtonLumo/2.2.0 (iPadOS 27.2; Apple iPad)', false, 'flex-row', 'flex-1'],
        ['browser', 'Mozilla/5.0', true, 'flex-row', 'flex-1'],
    ])('lays out the %s card for the selected composer', (_name, userAgent, enabled, direction, bodySize) => {
        Object.defineProperty(navigator, 'userAgent', { configurable: true, value: userAgent });
        (useLumoFlags as jest.Mock).mockReturnValue({ nativeComposer: enabled });
        const { container } = render(
            <ComposerNotificationCard
                title="Liking Lumo?"
                description="Create an account or sign in to save your chats and increase limits."
                action={<button>Create a free account</button>}
            />
        );
        expect(container.firstChild).toHaveClass(direction);
        expect(container.firstChild?.firstChild).toHaveClass(bodySize);
    });
});
