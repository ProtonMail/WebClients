import { act, fireEvent } from '@testing-library/react';

import { wait } from '@proton/shared/lib/helpers/promise';

import { addApiMock } from '../../../helpers/test/api';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import { EOGetHistory, EORender, EOResetHistory } from '../../../helpers/test/eo/EORender';
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
import { init } from '../../../logic/eo/eoActions';
import { store } from '../../../logic/eo/eoStore';
import { EOMessage } from '../../../logic/eo/eoType';
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

    beforeEach(async () => {
        await store.dispatch(init({ get: jest.fn() }));
    });

    afterEach(EOClearAll);

    it('should display an error if the EO id is not present', async () => {
        const { getByText } = await EORender(<EOUnlock {...props} />);

        getByText('Error');
        getByText('Sorry, this message does not exist or has already expired.');
    });

    it('should display an error if the EO id is invalid', async () => {
        addApiMock('mail/v4/eo/token/invalidID', () => ({}));

        EOResetHistory(['/eo/invalidID']);

        const { getByText } = await EORender(<EOUnlock {...props} />, '/eo/:id');

        getByText('Error');
        getByText('Sorry, this message does not exist or has already expired.');
    });

    it('should see the form if the EO id is valid and an error if password is invalid', async () => {
        mockConsole();

        EOResetHistory([`/eo/${validID}`]);

        // Get token from id mock
        addApiMock(`mail/v4/eo/token/${validID}`, () => ({ Token: 'token' }));

        const { getByText, getByTestId } = await EORender(<EOUnlock {...props} />, '/eo/:id');

        // Unlock form is displayed
        getByText('Unlock message');

        const unlockInput = getByTestId('unlock:input');

        // Type the password
        fireEvent.change(unlockInput, { target: { value: EOInvalidPassword } });
        fireEvent.keyDown(unlockInput, { key: 'Enter' });

        await waitForNotification('Wrong mailbox password');
    });

    it('should see the form if the EO id is valid and redirect if password is valid', async () => {
        mockConsole('log');

        const token = await getEOEncryptedMessage(EODecryptedToken, EOPassword);

        EOResetHistory([`/eo/${validID}`]);

        // Get token from id mock
        addApiMock(`mail/v4/eo/token/${validID}`, () => ({ Token: token }));

        // Get EO message from decryptedToken and password
        addApiMock('mail/v4/eo/message', () => ({
            Message: {} as EOMessage,
            PublicKey: '',
        }));

        const { getByText, getByTestId } = await EORender(<EOUnlock {...props} />, '/eo/:id');

        // Unlock form is displayed
        getByText('Unlock message');

        const unlockInput = getByTestId('unlock:input');

        // Type the password
        fireEvent.change(unlockInput, { target: { value: EOPassword } });
        fireEvent.keyDown(unlockInput, { key: 'Enter' });

        // Wait for redirection
        await act(async () => {
            await wait(2000);
        });

        // Redirects to /eo/message/validID
        const history = EOGetHistory();
        expect(history.location.pathname).toBe(`/eo/message/${validID}`);
    });
});
