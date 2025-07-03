import { act, fireEvent, screen } from '@testing-library/react';

import { wait } from '@proton/shared/lib/helpers/promise';

import { addApiMock } from '../../../helpers/test/api';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import { EORender } from '../../../helpers/test/eo/EORender';
import {
    EOClearAll,
    EODecryptedToken,
    EOInvalidPassword,
    EOPassword,
    getEOEncryptedMessage,
    mockConsole,
    validID,
} from '../../../helpers/test/eo/helpers';
import { waitForNotification } from '../../../helpers/test/helper';
import type { EOMessage } from '../../../store/eo/eoType';
import EOUnlock from './EOUnlock';

const props = {
    setSessionStorage: jest.fn(),
};

describe('Encrypted Outside Unlock', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(EOClearAll);

    it('should display an error if the EO id is not present', async () => {
        await EORender(<EOUnlock {...props} />, { invalid: true });

        screen.getByText('Error');
        screen.getByText('Sorry, this message does not exist or has already expired.');
    });

    it('should display an error if the EO id is invalid', async () => {
        addApiMock('mail/v4/eo/token/invalidID', () => ({}));

        await EORender(<EOUnlock {...props} />, {
            routePath: '/eo/:id',
            initialEntries: ['/eo/invalidID'],
            invalid: true,
        });

        screen.getByText('Error');
        screen.getByText('Sorry, this message does not exist or has already expired.');
    });

    it('should see the form if the EO id is valid and an error if password is invalid', async () => {
        mockConsole();

        // Get token from id mock
        addApiMock(`mail/v4/eo/token/${validID}`, () => ({ Token: 'token' }));

        await EORender(<EOUnlock {...props} />, {
            routePath: '/eo/:id',
            initialEntries: [`/eo/${validID}`],
        });

        // Unlock form is displayed
        screen.getByText('Unlock message');

        const unlockInput = screen.getByTestId('unlock:input');

        // Type the password
        fireEvent.change(unlockInput, { target: { value: EOInvalidPassword } });
        fireEvent.keyDown(unlockInput, { key: 'Enter' });

        await waitForNotification('Wrong password');
    });

    it('should see the form if the EO id is valid and redirect if password is valid', async () => {
        mockConsole('log');

        const token = await getEOEncryptedMessage(EODecryptedToken, EOPassword);

        // Get token from id mock
        addApiMock(`mail/v4/eo/token/${validID}`, () => ({ Token: token }));

        // Get EO message from decryptedToken and password
        addApiMock('mail/v4/eo/message', () => ({
            Message: {} as EOMessage,
            PublicKey: '',
        }));

        const { history } = await EORender(<EOUnlock {...props} />, {
            routePath: '/eo/:id',
            initialEntries: [`/eo/${validID}`],
        });

        // Unlock form is displayed
        screen.getByText('Unlock message');

        const unlockInput = screen.getByTestId('unlock:input');

        // Type the password
        fireEvent.change(unlockInput, { target: { value: EOPassword } });
        fireEvent.keyDown(unlockInput, { key: 'Enter' });

        // Wait for redirection
        await act(async () => {
            await wait(2000);
        });

        // Redirects to /eo/message/validID
        expect(history.location.pathname).toBe(`/eo/message/${validID}`);
    });
});
