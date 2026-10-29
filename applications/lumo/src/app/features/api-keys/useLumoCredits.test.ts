import { renderHook, waitFor } from '@testing-library/react';

import { useApi } from '@proton/app-context/useApi';
import { MOCK_LUMO_CREDIT_RESPONSE } from '@proton/payments/testing/lumo-credit';

import { useLumoCredits } from './useLumoCredits';

jest.mock('@proton/app-context/useApi');

const setup = (api: jest.Mock) => {
    (useApi as jest.Mock).mockReturnValue(api);
    return renderHook(() => useLumoCredits()).result;
};

describe('useLumoCredits', () => {
    it('reads the balance in whole credits without notifying on failure', async () => {
        const api = jest.fn().mockResolvedValue({ ...MOCK_LUMO_CREDIT_RESPONSE, Balance: '5.5580000000' });

        const result = setup(api);

        expect(result.current).toMatchObject({ balance: undefined, loading: true });
        await waitFor(() => expect(result.current).toMatchObject({ balance: 5.558, loading: false }));
        expect(result.current.error).toBeUndefined();
        expect(api).toHaveBeenCalledWith({ url: 'payments/v5/products/lumo-credit', method: 'get', silence: true });
    });

    it('reports an error without a balance when the request fails', async () => {
        const error = new Error('You do not have an active subscription');
        const result = setup(jest.fn().mockRejectedValue(error));

        await waitFor(() => expect(result.current).toMatchObject({ balance: undefined, loading: false, error }));
    });

    it.each(['', 'not-a-number', null])('reports no balance when the balance is %p', async (Balance) => {
        const result = setup(jest.fn().mockResolvedValue({ ...MOCK_LUMO_CREDIT_RESPONSE, Balance }));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.balance).toBeUndefined();
    });
});
