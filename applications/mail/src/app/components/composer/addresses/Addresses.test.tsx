import React, { MutableRefObject } from 'react';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';

import { clearAll, render } from '../../../helpers/test/helper';
import Addresses from './Addresses';
import { MessageExtended } from '../../../models/message';
import { MessageSendInfo } from '../../../hooks/useSendInfo';

const email1 = 'test@test.com';
const email2 = 'test2@test.com';

const message: MessageExtended = {
    localID: 'localId',
    data: { ToList: [{ Address: email1 }, { Address: email2 }] } as Message,
};

const messageSendInfo: MessageSendInfo = {
    message,
    mapSendInfo: {
        [email1]: {
            loading: false,
            emailValidation: true,
        },
        [email2]: {
            loading: false,
            emailValidation: true,
        },
    },
    setMapSendInfo: () => jest.fn(),
};

const props = {
    message,
    messageSendInfo,
    disabled: false,
    onChange: () => jest.fn(),
    addressesBlurRef: {} as MutableRefObject<() => void>,
    addressesFocusRef: {} as MutableRefObject<() => void>,
};

describe('Addresses', () => {
    afterEach(clearAll);

    it('should render Addresses', async () => {
        const { getByText } = await render(<Addresses {...props} />);

        getByText(email1);
        getByText(email2);
    });
});
