import { expect } from '@jest/globals';
import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import useFeature from '@proton/features/useFeature';
import type { KeyReactivationRequest } from '@proton/shared/lib/keys/reactivation/interface';

import { useInactiveKeys } from '../../../inactiveKeys/hooks';
import { OutgoingLockedDataWarning, useShouldShowLockedDataWarning } from './OutgoingLockedDataWarning';

jest.mock('../../../inactiveKeys/hooks', () => ({
    useInactiveKeys: jest.fn(),
}));

jest.mock('@proton/features/useFeature', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('@proton/components/containers/keys/reactivateKeys/ReactivateKeysModal', () => ({
    __esModule: true,
    default: ({ open, keyReactivationRequests }: { open: boolean; keyReactivationRequests: unknown[] }) =>
        open ? <div data-testid="reactivate-keys-modal">{keyReactivationRequests.length} requests</div> : null,
}));

const keyReactivationRequests = [{}, {}] as unknown as KeyReactivationRequest[];

const renderWarning = (props: Partial<Parameters<typeof OutgoingLockedDataWarning>[0]> = {}) => {
    const onAddContact = jest.fn();
    render(
        <OutgoingLockedDataWarning
            title="Locked title."
            description="Locked description."
            onAddContact={onAddContact}
            {...props}
        />
    );
    return { onAddContact };
};

describe('OutgoingLockedDataWarning', () => {
    beforeEach(() => {
        jest.mocked(useInactiveKeys).mockReturnValue(keyReactivationRequests);
    });

    it('renders the title and description', () => {
        renderWarning();

        expect(screen.getByText('Locked title.')).toBeInTheDocument();
        expect(screen.getByText('Locked description.', { exact: false })).toBeInTheDocument();
    });

    it('calls onAddContact when clicking add contact', async () => {
        const { onAddContact } = renderWarning();

        await userEvent.click(screen.getByRole('button', { name: 'Add contact' }));

        expect(onAddContact).toHaveBeenCalledTimes(1);
    });

    it('disables add contact when addContactDisabled is set', async () => {
        const { onAddContact } = renderWarning({ addContactDisabled: true });

        const addContactButton = screen.getByRole('button', { name: 'Add contact' });
        await userEvent.click(addContactButton);

        expect(addContactButton).toBeDisabled();
        expect(onAddContact).not.toHaveBeenCalled();
    });

    it('opens the reactivate keys modal with the inactive keys when clicking unlock data', async () => {
        renderWarning();

        expect(screen.queryByTestId('reactivate-keys-modal')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Unlock data' }));

        expect(screen.getByTestId('reactivate-keys-modal')).toHaveTextContent('2 requests');
    });
});

describe('useShouldShowLockedDataWarning', () => {
    const mockState = ({
        inactiveKeys,
        dismissedRecoverDataCard,
    }: {
        inactiveKeys: KeyReactivationRequest[];
        dismissedRecoverDataCard: boolean | undefined;
    }) => {
        jest.mocked(useInactiveKeys).mockReturnValue(inactiveKeys);
        jest.mocked(useFeature).mockReturnValue({
            feature: dismissedRecoverDataCard === undefined ? undefined : { Value: dismissedRecoverDataCard },
        } as ReturnType<typeof useFeature>);
    };

    it('returns true when there are inactive keys and the recover data card was not dismissed', () => {
        mockState({ inactiveKeys: keyReactivationRequests, dismissedRecoverDataCard: false });

        const { result } = renderHook(() => useShouldShowLockedDataWarning());

        expect(result.current).toBe(true);
    });

    it('returns false when the recover data card was dismissed', () => {
        mockState({ inactiveKeys: keyReactivationRequests, dismissedRecoverDataCard: true });

        const { result } = renderHook(() => useShouldShowLockedDataWarning());

        expect(result.current).toBe(false);
    });

    it('returns false while the dismissed state is not loaded yet', () => {
        mockState({ inactiveKeys: keyReactivationRequests, dismissedRecoverDataCard: undefined });

        const { result } = renderHook(() => useShouldShowLockedDataWarning());

        expect(result.current).toBe(false);
    });

    it('returns false when there are no inactive keys', () => {
        mockState({ inactiveKeys: [], dismissedRecoverDataCard: false });

        const { result } = renderHook(() => useShouldShowLockedDataWarning());

        expect(result.current).toBe(false);
    });
});
