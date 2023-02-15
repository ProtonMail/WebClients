import { useLocation } from 'react-router-dom';

import { fireEvent, screen } from '@testing-library/dom';

import { easySwitchRender } from '@proton/activation/src/tests/render';

import StepSuccess from './StepSuccess';

jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useLocation: jest.fn() }));

const mockedUseLocation = useLocation as jest.Mock;

describe('StepSuccess tests', () => {
    it('Should render simple success step, no settings button while in settings', async () => {
        mockedUseLocation.mockImplementation(() => {
            return { pathname: '/easy-switch' };
        });

        easySwitchRender(<StepSuccess />);
        screen.getByTestId('StepSuccess:Modal');
        expect(screen.queryByTestId('StepSuccess:SettingsLink')).toBeNull();

        const closeButton = screen.getByTestId('StepSuccess:CloseButton');
        fireEvent.click(closeButton);
    });

    it('Should renter the settings link button if not in settings', () => {
        mockedUseLocation.mockImplementation(() => {
            return { pathname: '/mail' };
        });

        easySwitchRender(<StepSuccess />);
        screen.getByTestId('StepSuccess:Modal');
        screen.getByTestId('StepSuccess:SettingsLink');
        screen.getByTestId('StepSuccess:RedirectFooter');
        const submitFooter = screen.getByTestId('StepSuccess:RedirectFooterSubmit');
        fireEvent.click(submitFooter);
    });
});
