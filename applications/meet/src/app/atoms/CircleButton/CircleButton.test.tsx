import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IcMeetCamera } from '@proton/icons/icons/IcMeetCamera';

import { CircleButton } from './CircleButton';

describe('CircleButton', () => {
    it('should call onClick and not be aria-disabled when it is not loading', async () => {
        const onClick = vi.fn();

        render(<CircleButton IconComponent={IcMeetCamera} ariaLabel="Turn off camera" onClick={onClick} />);

        const button = screen.getByRole('button', { name: 'Turn off camera' });
        await userEvent.setup().click(button);

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(button).not.toHaveAttribute('aria-disabled');
    });

    it('should stay focusable, be aria-disabled and ignore clicks while loading', async () => {
        const onClick = vi.fn();

        render(<CircleButton IconComponent={IcMeetCamera} ariaLabel="Turn on camera" onClick={onClick} loading />);

        const button = screen.getByRole('button', { name: 'Turn on camera' });
        const user = userEvent.setup();
        await user.tab();
        await user.keyboard('{Enter}');

        expect(button).toBeEnabled();
        expect(button).toHaveFocus();
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(onClick).not.toHaveBeenCalled();
    });
});
