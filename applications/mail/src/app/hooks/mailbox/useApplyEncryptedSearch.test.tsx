import { act } from '@testing-library/react-hooks';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { defaultESContextMail } from '../../constants';
import { mockUseEncryptedSearchContext } from '../../helpers/tests/mockUseEncryptedSearchContext';
import { renderHook } from '../../helpers/tests/render';
import { useApplyEncryptedSearch } from './useApplyEncryptedSearch';

const props = {
    labelID: MAILBOX_LABEL_IDS.ALL_MAIL,
    page: 0,
    pageSize: 50,
    sort: { sort: 'Time', desc: true } as const,
    filter: {},
    search: { keyword: 'hello' },
    onPage: jest.fn(),
};

/** An index that can answer searches, with ES startup settled or still running. */
const mockESContext = ({
    isStartupSettled,
    encryptedSearch,
}: {
    isStartupSettled: boolean;
    encryptedSearch: jest.Mock;
}) =>
    mockUseEncryptedSearchContext({
        encryptedSearch,
        esStatus: {
            ...defaultESContextMail.esStatus,
            dbExists: true,
            esEnabled: true,
            isStartupSettled,
            getCacheStatus: () => ({ isCacheReady: true, isCacheLimited: false }),
        },
    });

describe('useApplyEncryptedSearch', () => {
    it('should search the index once ES startup has settled', async () => {
        const encryptedSearch = jest.fn().mockResolvedValue(true);
        mockESContext({ isStartupSettled: true, encryptedSearch });

        await renderHook({ useCallback: () => useApplyEncryptedSearch(props) });

        expect(encryptedSearch).toHaveBeenCalledTimes(1);
    });

    // Landing on a search URL - a reload while searching - runs this hook before ES startup has
    // settled. Searching then would show server results for a beat before the index answers.
    it('should not search at all while ES startup is still running', async () => {
        const encryptedSearch = jest.fn().mockResolvedValue(true);
        mockESContext({ isStartupSettled: false, encryptedSearch });

        const { store } = await renderHook({ useCallback: () => useApplyEncryptedSearch(props) });

        expect(encryptedSearch).not.toHaveBeenCalled();
        // `executeSearch` marks the request as pending before it decides between index and server,
        // so this staying false means neither ran.
        expect(store.getState().elements.pendingRequest).toBe(false);
    });

    it('should search the index as soon as ES startup settles', async () => {
        const encryptedSearch = jest.fn().mockResolvedValue(true);
        mockESContext({ isStartupSettled: false, encryptedSearch });

        const { rerender } = await renderHook({ useCallback: () => useApplyEncryptedSearch(props) });
        expect(encryptedSearch).not.toHaveBeenCalled();

        mockESContext({ isStartupSettled: true, encryptedSearch });
        await act(async () => {
            rerender();
        });

        expect(encryptedSearch).toHaveBeenCalledTimes(1);
    });
});
