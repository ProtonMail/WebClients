import { fireEvent, screen } from '@testing-library/dom';

import { easySwitchRender } from '../../../../tests/render';
import { DriveInstructionsStep } from './DriveInstructionsStep';

describe('DriveInstructionsStep', () => {
    it('cancels without starting OAuth', () => {
        const triggerOAuth = jest.fn();

        easySwitchRender(<DriveInstructionsStep triggerOAuth={triggerOAuth} />);
        fireEvent.click(screen.getByText('Maybe later'));

        expect(triggerOAuth).not.toHaveBeenCalled();
    });

    it('moves to the sign-in tutorial on Continue, which triggers OAuth on Google sign-in', () => {
        const triggerOAuth = jest.fn();

        easySwitchRender(<DriveInstructionsStep triggerOAuth={triggerOAuth} />);
        fireEvent.click(screen.getByText('Continue'));

        screen.getByText('Sign in and grant access');
        fireEvent.click(screen.getByText('Sign in with Google'));
        expect(triggerOAuth).toHaveBeenCalledTimes(1);
    });
});
