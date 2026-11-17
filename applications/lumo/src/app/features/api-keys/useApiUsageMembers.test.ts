import { act, renderHook, waitFor } from '@testing-library/react';

import { useApi } from '@proton/app-context/useApi';

import { useApiUsageMembers } from './useApiUsageMembers';

jest.mock('@proton/app-context/useApi');

describe('useApiUsageMembers', () => {
    it('reads the API usage per member over the period without notifying on failure', async () => {
        const members = [{ MemberID: 'member-alice', Totals: {} }];
        const api = jest.fn().mockResolvedValue({ Code: 1000, Members: members });
        (useApi as jest.Mock).mockReturnValue(api);

        const { result } = renderHook(() => useApiUsageMembers('2026-10-18', '2026-11-16'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(api).toHaveBeenCalledWith({
            url: 'ai/v1/usage/members',
            method: 'get',
            params: { From: '2026-10-18', To: '2026-11-16', ClientType: 'api' },
            silence: true,
        });
        expect(result.current).toMatchObject({ rows: members, error: false });
    });

    it('waits for a period before reading', () => {
        const api = jest.fn();
        (useApi as jest.Mock).mockReturnValue(api);

        const { result } = renderHook(() => useApiUsageMembers(undefined, undefined));

        expect(api).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(true);
    });

    it('reports an error when the member usage cannot be read', async () => {
        (useApi as jest.Mock).mockReturnValue(jest.fn().mockRejectedValue(new Error('403')));

        const { result } = renderHook(() => useApiUsageMembers('2026-10-18', '2026-11-16'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current).toMatchObject({ rows: [], error: true });
    });

    it('drops the previous period’s usage while the new period loads', async () => {
        const api = jest
            .fn()
            .mockResolvedValueOnce({ Code: 1000, Members: [{ MemberID: 'member-alice', Totals: {} }] })
            .mockReturnValueOnce(new Promise(() => {}));
        (useApi as jest.Mock).mockReturnValue(api);
        const { result, rerender } = renderHook(({ from }) => useApiUsageMembers(from, '2026-11-16'), {
            initialProps: { from: '2026-10-18' },
        });
        await waitFor(() => expect(result.current.rows).toHaveLength(1));

        rerender({ from: '2026-11-10' });

        expect(result.current).toMatchObject({ rows: [], isLoading: true });
        expect(api).toHaveBeenLastCalledWith(
            expect.objectContaining({ params: expect.objectContaining({ From: '2026-11-10' }) })
        );
    });

    it('ignores the previous period’s answer when it arrives after the switch', async () => {
        let answerPreviousPeriod: (value: unknown) => void = () => {};
        const currentRows = [{ MemberID: 'member-bob', Totals: {} }];
        const api = jest
            .fn()
            .mockReturnValueOnce(new Promise((resolve) => (answerPreviousPeriod = resolve)))
            .mockResolvedValueOnce({ Code: 1000, Members: currentRows });
        (useApi as jest.Mock).mockReturnValue(api);
        const { result, rerender } = renderHook(({ from }) => useApiUsageMembers(from, '2026-11-16'), {
            initialProps: { from: '2026-10-18' },
        });

        rerender({ from: '2026-11-10' });
        await waitFor(() => expect(result.current.rows).toBe(currentRows));
        await act(async () =>
            answerPreviousPeriod({ Code: 1000, Members: [{ MemberID: 'member-alice', Totals: {} }] })
        );

        expect(result.current.rows).toBe(currentRows);
    });
});
