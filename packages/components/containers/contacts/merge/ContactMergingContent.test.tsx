import { render, waitFor } from '@testing-library/react';

import { prepareVCardContact } from '@proton/shared/lib/contacts/encrypt';

import useApi from '../../../hooks/useApi';
import ContactMergingContent from './ContactMergingContent';

const encrypt = prepareVCardContact as jest.Mock;

jest.mock('../../../hooks/useApi', () => {
    const apiMock = jest.fn(({ url, method }) => {
        if (method === 'get') {
            const parts = url.split('/');
            return Promise.resolve({ Contact: { ID: parts[parts.length - 1] } });
        }
        if (method === 'post') {
            return Promise.resolve({ Responses: [{ Response: { Code: 1000, Contact: { ID: 'id1' } } }] });
        }
        if (method === 'put') {
            return Promise.resolve();
        }
    });

    return () => apiMock;
});

jest.mock('@proton/account/userKeys/hooks', () => {
    return {
        useUserKeys: () => [[]],
    };
});

jest.mock('@proton/shared/lib/contacts/decrypt', () => {
    return {
        prepareVCardContact: jest.fn(({ ID }) => {
            return Promise.resolve({ vCardContact: { nickname: [{ field: 'nickname', value: ID }] }, errors: [] });
        }),
    };
});

jest.mock('@proton/shared/lib/contacts/encrypt', () => {
    return {
        prepareVCardContact: jest.fn(() => {
            return Promise.resolve({ Cards: ['something encrypted'] });
        }),
    };
});

window.ResizeObserver =
    window.ResizeObserver ||
    jest.fn().mockImplementation(() => ({
        disconnect: jest.fn(),
        observe: jest.fn(),
        unobserve: jest.fn(),
    }));

describe('ContactMergingContent', () => {
    const id1 = 'id1';
    const id2 = 'id2';

    it('should perform a simple merge', async () => {
        render(
            <ContactMergingContent
                // userKeysList={[]}
                mergeFinished={false}
                beMergedModel={{ [id1]: [id1, id2] }}
                beDeletedModel={{}}
                totalBeMerged={1}
                totalBeDeleted={1}
                onFinish={jest.fn()}
            />
        );

        const apiMock = useApi() as jest.Mock;

        await waitFor(() => {
            expect(apiMock).toHaveBeenCalledTimes(4); // 2 gets, 1 update, 1 delete
        });

        const encryptedProps = encrypt.mock.calls[0][0];

        expect(encryptedProps.nickname[0].field).toBe('nickname');
        expect(encryptedProps.nickname[0].value).toBe(id1);
        expect(encryptedProps.nickname[1].field).toBe('nickname');
        expect(encryptedProps.nickname[1].value).toBe(id2);

        const updateCall = apiMock.mock.calls[2];
        expect(updateCall[0].data.Contacts[0].Cards[0]).toBe('something encrypted');

        const deleteCall = apiMock.mock.calls[3];
        expect(deleteCall[0].data.IDs).toEqual([id2]);
    });
});
