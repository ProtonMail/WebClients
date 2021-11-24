import { render, waitFor } from '@testing-library/react';
import { prepareContact } from '@proton/shared/lib/contacts/encrypt';
import MergingModalContent from './MergingModalContent';
import useApi from '../../../hooks/useApi';

const encrypt = prepareContact as jest.Mock;

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

jest.mock('@proton/shared/lib/contacts/decrypt', () => {
    return {
        prepareContact: jest.fn(({ ID }) => {
            return Promise.resolve({ properties: [{ field: 'nickname', value: ID }], errors: [] });
        }),
    };
});

jest.mock('@proton/shared/lib/contacts/encrypt', () => {
    return {
        prepareContact: jest.fn(() => {
            return Promise.resolve({ Cards: ['something encrypted'] });
        }),
    };
});

describe('MergingModalContent', () => {
    const id1 = 'id1';
    const id2 = 'id2';

    it('should perform a simple merge', async () => {
        render(
            <MergingModalContent
                userKeysList={[]}
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
        expect(encryptedProps[0].field).toBe('nickname');
        expect(encryptedProps[0].value).toBe(id1);
        expect(encryptedProps[1].field).toBe('nickname');
        expect(encryptedProps[1].value).toBe(id2);

        const updateCall = apiMock.mock.calls[2];
        expect(updateCall[0].data.Contacts[0].Cards[0]).toBe('something encrypted');

        const deleteCall = apiMock.mock.calls[3];
        expect(deleteCall[0].data.IDs).toEqual([id2]);
    });
});
