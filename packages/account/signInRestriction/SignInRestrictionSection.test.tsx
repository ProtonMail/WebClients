import { expect } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { mockUseApi } from '@proton/app-context/testing/mockUseApi';
import { mockUseNotifications } from '@proton/app-context/testing/mockUseNotifications';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import { updateSignInRestriction } from '@proton/shared/lib/api/settings';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import {
    LOGIN_IDENTIFIER_POLICY,
    RESTRICTED_LOGIN_IDENTIFIER_POLICY,
} from '@proton/shared/lib/interfaces/UserSettings';

import { TestStoreProvider } from '../testing/TestStoreProvider';
import { buildAddress } from '../testing/buildAddress';
import { mockUseAddresses } from '../testing/mockUseAddresses';
import { mockUseUser } from '../testing/mockUseUser';
import { useUserSettings } from '../userSettings/hooks';
import SignInRestrictionSection from './SignInRestrictionSection';

window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

jest.mock('../userSettings/hooks');
const mockedUseUserSettings = useUserSettings as jest.Mock;

const renderSection = () => {
    const { store } = getTestStore({
        reducer: () => ({}),
        extraThunkArguments: {} as ProtonThunkArguments,
    });

    return render(
        <TestStoreProvider store={store}>
            <SignInRestrictionSection />
        </TestStoreProvider>
    );
};

describe('SignInRestrictionSection', () => {
    let mockedApi: jest.Mock;

    beforeEach(() => {
        mockedApi = jest.fn();
        mockUseApi(mockedApi);
        mockUseNotifications();
        mockUseUser([{ Name: 'eric.norbert' }]);
        mockedUseUserSettings.mockReturnValue([{ LoginIdentifierPolicy: LOGIN_IDENTIFIER_POLICY.ALL }]);
    });

    it('mentions the username and its matching Proton address', () => {
        mockUseAddresses([
            [
                buildAddress({
                    Email: 'eric.norbert@proton.me',
                    Type: ADDRESS_TYPE.TYPE_ORIGINAL,
                    Status: 1,
                    Receive: 1,
                    Send: 1,
                }),
            ],
        ]);

        renderSection();

        expect(
            screen.getByText((_, element) => {
                return (
                    element?.textContent ===
                    'When sign-in is restricted, you can only sign in with your original username eric.norbert, either on its own or as eric.norbert@proton.me. Your other email addresses won’t work for sign-in.'
                );
            })
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Restrict sign-in to username and matching Proton addresses')).not.toBeChecked();
    });

    it('appends every Proton domain with an enabled original address', () => {
        mockUseAddresses([
            [
                buildAddress({ Email: 'eric.norbert@proton.me', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 1 }),
                buildAddress({ Email: 'eric.norbert@protonmail.com', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 1 }),
                buildAddress({ Email: 'eric.norbert@protonmail.ch', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 1 }),
            ],
        ]);

        renderSection();

        expect(
            screen.getByText((_, element) => {
                return (
                    element?.textContent ===
                    'When sign-in is restricted, you can only sign in with your original username eric.norbert, either on its own or as eric.norbert@proton.me, @protonmail.com, or @protonmail.ch. Your other email addresses won’t work for sign-in.'
                );
            })
        ).toBeInTheDocument();
    });

    it('does not append a Proton domain whose original address is disabled', () => {
        mockUseAddresses([
            [
                buildAddress({ Email: 'eric.norbert@proton.me', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 1 }),
                buildAddress({ Email: 'eric.norbert@protonmail.com', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 1 }),
                buildAddress({ Email: 'eric.norbert@protonmail.ch', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 0 }),
            ],
        ]);

        renderSection();

        expect(
            screen.getByText((_, element) => {
                return (
                    element?.textContent ===
                    'When sign-in is restricted, you can only sign in with your original username eric.norbert, either on its own or as eric.norbert@proton.me, or @protonmail.com. Your other email addresses won’t work for sign-in.'
                );
            })
        ).toBeInTheDocument();
    });

    it('mentions only the username when the account has no address', () => {
        mockUseAddresses([[]]);

        renderSection();

        expect(
            screen.getByText((_, element) => {
                return (
                    element?.textContent ===
                    'When sign-in is restricted, only your username eric.norbert can be used to sign in. Your other addresses can’t be linked back to your account, even if someone knows them.'
                );
            })
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Restrict sign-in to username')).toBeInTheDocument();
    });

    it('mentions only the email when the account has no username', () => {
        mockUseUser([{ Name: '' }]);
        mockUseAddresses([
            [
                buildAddress({
                    Email: 'eric.norbert@proton.me',
                    Type: ADDRESS_TYPE.TYPE_ORIGINAL,
                    Status: 1,
                    Receive: 1,
                    Send: 1,
                }),
            ],
        ]);

        renderSection();

        expect(
            screen.getByText((_, element) => {
                return (
                    element?.textContent ===
                    'When sign-in is restricted, only your email eric.norbert@proton.me can be used to sign in. Your other addresses can’t be linked back to your account, even if someone knows them.'
                );
            })
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Restrict sign-in to email address')).toBeInTheDocument();
    });

    it('reflects the saved restriction and sends the new value when toggled off', async () => {
        mockUseAddresses([[]]);
        mockedUseUserSettings.mockReturnValue([{ LoginIdentifierPolicy: RESTRICTED_LOGIN_IDENTIFIER_POLICY }]);
        mockedApi.mockResolvedValue({ Code: 1000 });

        renderSection();
        const toggle = screen.getByLabelText('Restrict sign-in to username');
        expect(toggle).toBeChecked();

        fireEvent.click(toggle);

        await waitFor(() => {
            expect(mockedApi).toHaveBeenCalledWith(
                updateSignInRestriction({ LoginIdentifierPolicy: LOGIN_IDENTIFIER_POLICY.ALL })
            );
        });
    });

    it('sends the username and primary address policy when toggled on', async () => {
        mockUseAddresses([[]]);
        mockedApi.mockResolvedValue({ Code: 1000 });

        renderSection();
        const toggle = screen.getByLabelText('Restrict sign-in to username');
        expect(toggle).not.toBeChecked();

        fireEvent.click(toggle);
        expect(mockedApi).not.toHaveBeenCalled();

        fireEvent.click(screen.getByText('Restrict sign-in', { selector: 'button' }));

        await waitFor(() => {
            expect(mockedApi).toHaveBeenCalledWith(
                updateSignInRestriction({ LoginIdentifierPolicy: RESTRICTED_LOGIN_IDENTIFIER_POLICY })
            );
        });
    });

    it('names the username and its matching Proton addresses in the confirmation', () => {
        mockUseAddresses([
            [
                buildAddress({
                    Email: 'eric.norbert@proton.me',
                    Type: ADDRESS_TYPE.TYPE_ORIGINAL,
                    Status: 1,
                    Receive: 1,
                    Send: 1,
                }),
            ],
        ]);

        renderSection();
        fireEvent.click(screen.getByLabelText('Restrict sign-in to username and matching Proton addresses'));

        expect(
            screen.getByText((_, element) => {
                return (
                    element?.tagName === 'P' &&
                    element.textContent ===
                        'By turning this on, you’ll only be able to sign in with your original username eric.norbert, either on its own or as eric.norbert@proton.me.'
                );
            })
        ).toBeInTheDocument();
        expect(
            screen.getByText('Your other email addresses won’t work for sign-in until you turn this off.')
        ).toBeInTheDocument();
    });

    it('does not restrict sign-in when the confirmation is cancelled', () => {
        mockUseAddresses([[]]);

        renderSection();
        fireEvent.click(screen.getByLabelText('Restrict sign-in to username'));
        fireEvent.click(screen.getByText('Cancel', { selector: 'button' }));

        expect(mockedApi).not.toHaveBeenCalled();
        expect(screen.getByLabelText('Restrict sign-in to username')).not.toBeChecked();
    });
});
