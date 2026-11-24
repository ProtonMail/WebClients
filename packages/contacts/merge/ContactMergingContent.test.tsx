import { render, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useApi } from '@proton/app-context/useApi';
import { prepareVCardContact } from '@proton/shared/lib/contacts/encrypt';

import ContactMergingContent from './ContactMergingContent';

const encrypt = prepareVCardContact as Mock;

vi.mock('@proton/app-context/useApi', () => {
    const apiMock = vi.fn(({ url, method }) => {
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

    return { useApi: () => apiMock };
});

vi.mock('@proton/account/userKeys/hooks', () => {
    return {
        useUserKeys: () => [[]],
    };
});

vi.mock('@proton/shared/lib/contacts/decrypt', () => {
    return {
        prepareVCardContact: vi.fn(({ ID }) => {
            return Promise.resolve({ vCardContact: { nickname: [{ field: 'nickname', value: ID }] }, errors: [] });
        }),
    };
});

vi.mock('@proton/shared/lib/contacts/encrypt', () => {
    return {
        prepareVCardContact: vi.fn(() => {
            return Promise.resolve({ Cards: ['something encrypted'] });
        }),
    };
});

window.ResizeObserver =
    window.ResizeObserver ||
    vi.fn().mockImplementation(() => ({
        disconnect: vi.fn(),
        observe: vi.fn(),
        unobserve: vi.fn(),
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
                onFinish={vi.fn()}
            />
        );

        const apiMock = useApi() as Mock;

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
