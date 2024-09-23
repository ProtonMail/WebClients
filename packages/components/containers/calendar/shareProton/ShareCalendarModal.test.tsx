import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mocked } from 'jest-mock';
import { setupServer } from 'msw/node';

import { CacheProvider } from '@proton/components/containers/cache/Provider';
import { useApi, useGetEncryptionPreferences, useNotifications } from '@proton/components/hooks';
import type { PublicKeyReference } from '@proton/crypto';
import { MIME_TYPES, PGP_SCHEMES } from '@proton/shared/lib/constants';
import createCache from '@proton/shared/lib/helpers/cache';
import type { EncryptionPreferences } from '@proton/shared/lib/mail/encryptionPreferences';
import { addressBuilder, calendarBuilder, mockApiWithServer, mockNotifications } from '@proton/testing';
import { getHandlers } from '@proton/testing/lib/handlers';

import ShareCalendarModal from './ShareCalendarModal';

const server = setupServer(...getHandlers());

jest.mock('@proton/components/hooks/useGetEncryptionPreferences');
jest.mock('@proton/components/hooks/useNotifications');
jest.mock('@proton/components/hooks/useApi');
jest.mock('@proton/components/hooks/useAddresses');
jest.mock('../../contacts/ContactEmailsProvider', () => ({
    useContactEmailsCache: () => ({
        contactEmails: [],
        contactGroups: [],
        contactEmailsMap: {},
        groupsWithContactsMap: {},
    }),
}));

const mockedUseApi = mocked(useApi);
const mockedUseNotifications = mocked(useNotifications);
const mockedUseGetEncryptionPreferences = mocked(useGetEncryptionPreferences);

const mockedEncryptionPreferences: EncryptionPreferences = {
    encrypt: true,
    sign: true,
    scheme: PGP_SCHEMES.PGP_INLINE,
    mimeType: MIME_TYPES.PLAINTEXT,
    isInternalWithDisabledE2EEForMail: false,
    sendKey: 'anything' as unknown as PublicKeyReference,
    apiKeys: [],
    pinnedKeys: [],
    verifyingPinnedKeys: [],
    isInternal: true,
    hasApiKeys: true,
    hasPinnedKeys: true,
    isContact: true,
    // error: new EncryptionPreferencesError(ENCRYPTION_PREFERENCES_ERROR_TYPES.EMAIL_ADDRESS_ERROR, 'EMAIL_ADDRESS_ERROR'),
};

function renderComponent({ members = [], invitations = [] } = {}) {
    const Wrapper = ({ children }: any) => <CacheProvider cache={createCache()}>{children}</CacheProvider>;

    return render(
        <ShareCalendarModal
            members={members}
            invitations={invitations}
            calendar={calendarBuilder()}
            addresses={[addressBuilder()]}
            onFinish={() => {}}
            open
        />,
        { wrapper: Wrapper }
    );
}

function addRecipients(emails: string[]) {
    const emailInput = screen.getByTitle('Email address');

    act(() => {
        emails.forEach(async (email) => {
            // FIXME: same issue as in MainContainer.spec.tsx, it doesn't enter recipients
            await userEvent.type(emailInput, `${email}{enter}`);
        });
    });
}

xdescribe('ShareCalendarModal', () => {
    beforeAll(() => server.listen());

    afterAll(() => server.close());

    beforeEach(() => {
        mockedUseApi.mockImplementation(() => mockApiWithServer);
        mockedUseNotifications.mockImplementation(() => mockNotifications);
        mockedUseGetEncryptionPreferences.mockImplementation(() => () => Promise.resolve(mockedEncryptionPreferences));
    });

    afterEach(() => {
        server.resetHandlers();
    });

    it(`removes duplicate recipients and self addresses when added and displays a notification`, async () => {
        renderComponent();

        addRecipients(['legit@pm.me']);

        await waitFor(() => {
            expect(screen.getByText(/legit@pm.me/)).toBeInTheDocument();
        });
        expect(screen.getByText(/decent.one@proton.me/)).toBeInTheDocument();
        expect(screen.queryByText(/legit\+dog@pm.me/)).not.toBeInTheDocument();
        expect(screen.queryByText(/stest1@proton.black/)).not.toBeInTheDocument();

        expect(mockedUseNotifications().createNotification).toHaveBeenCalledTimes(2);
    });

    it(`displays errors for existing members, invalid emails and exceeding the limit before submitting`, () => {
        renderComponent();
    });

    it(`displays errors for non-proton, non-existing and other errors after submitting`, () => {
        // assistive text when non-proton
        renderComponent();
    });

    it(`disables the share button if there are no recipients or there are errors`, () => {
        renderComponent();
        expect(screen.getByText(/Share/, { selector: 'button' })).toBeDisabled();
    });

    it(`shows a loading state when submitting and a notification once done`, () => {
        renderComponent();
    });
});
