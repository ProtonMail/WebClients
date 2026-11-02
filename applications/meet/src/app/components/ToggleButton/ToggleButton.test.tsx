import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IcMeetCamera } from '@proton/icons/icons/IcMeetCamera';
import { IcMeetCameraOff } from '@proton/icons/icons/IcMeetCameraOff';
import { PopUpControls } from '@proton/meet/store/slices/uiStateSlice';

import { ToggleButton } from './ToggleButton';

const renderToggleButton = (props: { loading?: boolean; onClick: () => void }) =>
    render(
        <ToggleButton
            OnIconComponent={IcMeetCamera}
            OffIconComponent={IcMeetCameraOff}
            isOn
            isOpen={false}
            onPopupButtonClick={vi.fn()}
            popUp={PopUpControls.Camera}
            ariaLabel="Turn off camera"
            secondaryAriaLabel="Video settings"
            {...props}
        />
    );

describe('ToggleButton', () => {
    it('should call onClick and not be aria-disabled when it is not loading', async () => {
        const onClick = vi.fn();

        renderToggleButton({ onClick });

        const button = screen.getByRole('button', { name: 'Turn off camera' });
        await userEvent.setup().click(button);

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(button).not.toHaveAttribute('aria-disabled');
    });

    it('should stay focusable, be aria-disabled and ignore clicks while loading', async () => {
        const onClick = vi.fn();

        renderToggleButton({ onClick, loading: true });

        const button = screen.getByRole('button', { name: 'Turn off camera' });
        const user = userEvent.setup();
        await user.tab();
        await user.keyboard('{Enter}');

        expect(button).toBeEnabled();
        expect(button).toHaveFocus();
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(onClick).not.toHaveBeenCalled();
    });
});
