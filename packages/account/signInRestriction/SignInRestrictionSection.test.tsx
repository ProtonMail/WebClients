import { expect } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { mockUseApi } from '@proton/app-context/testing/mockUseApi';
import { mockUseNotifications } from '@proton/app-context/testing/mockUseNotifications';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { ProtonStoreProvider } from '@proton/redux-shared-store/sharedProvider';
import { getTestStore } from '@proton/redux-shared-store/test';
import { updateSignInRestriction } from '@proton/shared/lib/api/settings';
import {
    LOGIN_IDENTIFIER_POLICY,
    RESTRICTED_LOGIN_IDENTIFIER_POLICY,
} from '@proton/shared/lib/interfaces/UserSettings';

import { buildAddress } from '../testing/buildAddress';
import { mockUseAddresses } from '../testing/mockUseAddresses';
import { mockUseUser } from '../testing/mockUseUser';
import { useUserSettings } from '../userSettings/hooks';
import SignInRestrictionSection from './SignInRestrictionSection';

jest.mock('../userSettings/hooks');
const mockedUseUserSettings = useUserSettings as jest.Mock;

const renderSection = () => {
    const { store } = getTestStore({
        reducer: () => ({}),
        extraThunkArguments: {} as ProtonThunkArguments,
    });

    return render(
        <ProtonStoreProvider store={store}>
            <SignInRestrictionSection />
        </ProtonStoreProvider>
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

    it('mentions the primary email address and username when the account has an address', () => {
        mockUseAddresses([[buildAddress({ Email: 'eric.norbert@proton.me', Status: 1, Receive: 1, Send: 1 })]]);

        renderSection();

        expect(
            screen.getByText((_, element) => {
                return (
                    element?.textContent ===
                    'When sign-in is restricted, only eric.norbert@proton.me and your username eric.norbert can be used to sign in. Your other addresses can’t be linked back to your account, even if someone knows them.'
                );
            })
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Restrict sign-in to primary email address')).not.toBeChecked();
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
        mockUseAddresses([[buildAddress({ Email: 'eric.norbert@proton.me', Status: 1, Receive: 1, Send: 1 })]]);

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

        await waitFor(() => {
            expect(mockedApi).toHaveBeenCalledWith(
                updateSignInRestriction({ LoginIdentifierPolicy: RESTRICTED_LOGIN_IDENTIFIER_POLICY })
            );
        });
    });
});
