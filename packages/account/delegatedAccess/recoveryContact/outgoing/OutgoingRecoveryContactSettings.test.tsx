import { expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import useFeature from '@proton/features/useFeature';
import type { KeyReactivationRequest } from '@proton/shared/lib/keys/reactivation/interface';

import { useInactiveKeys } from '../../../inactiveKeys/hooks';
import { useIsSentinelUser } from '../../../recovery/sentinelHooks';
import {
    type OutgoingDelegatedAccessProviderValue,
    useOutgoingController,
} from '../../shared/OutgoingDelegatedAccessProvider';
import type { OutgoingItemsResult } from '../../shared/outgoing/useOutgoingItems';
import { OutgoingRecoveryContactSettings } from './OutgoingRecoveryContactSettings';

jest.mock('../../../inactiveKeys/hooks', () => ({
    useInactiveKeys: jest.fn(),
}));

jest.mock('../../../recovery/sentinelHooks', () => ({
    useIsSentinelUser: jest.fn(),
}));

jest.mock('../../shared/OutgoingDelegatedAccessProvider', () => ({
    useOutgoingController: jest.fn(),
}));

jest.mock('@proton/features/useFeature', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('@proton/components/containers/keys/reactivateKeys/ReactivateKeysModal', () => ({
    __esModule: true,
    default: () => null,
}));

const lockedDataTitle = 'Recover your data before adding a new contact.';

const mockController = () => {
    const notify = jest.fn();
    const outgoingDelegatedAccess = {
        isAvailable: true,
        loading: false,
        hasKeysToReactivate: false,
        recoveryContacts: {
            hasAccess: true,
            items: [],
            hasReachedLimit: false,
            limit: 10,
            lastModifiedTime: null,
        },
    } as unknown as OutgoingItemsResult;
    jest.mocked(useOutgoingController).mockReturnValue({
        notify,
        subscribe: jest.fn(),
        outgoingDelegatedAccess,
    } as OutgoingDelegatedAccessProviderValue);
    return { notify };
};

const mockHasDismissedRecoverDataCard = (value: boolean) => {
    jest.mocked(useFeature).mockReturnValue({ feature: { Value: value } } as ReturnType<typeof useFeature>);
};

const mockInactiveKeys = (count: number) => {
    jest.mocked(useInactiveKeys).mockReturnValue(Array.from({ length: count }, () => ({}) as KeyReactivationRequest));
};

const mockIsSentinelUser = (isSentinelUser: boolean) => {
    jest.mocked(useIsSentinelUser).mockReturnValue([{ isSentinelUser } as any, false]);
};

describe('OutgoingRecoveryContactSettings', () => {
    beforeEach(() => {
        mockIsSentinelUser(false);
        mockHasDismissedRecoverDataCard(false);
    });

    it('shows the add recovery contact button without the locked data warning when there are no inactive keys', () => {
        mockController();
        mockInactiveKeys(0);

        render(<OutgoingRecoveryContactSettings userHasNoAccountRecoveryMethodSet={false} />);

        expect(screen.getByRole('button', { name: 'Add recovery contact' })).toBeEnabled();
        expect(screen.queryByText(lockedDataTitle)).not.toBeInTheDocument();
    });

    it('replaces the add recovery contact button with the locked data warning when there are inactive keys', () => {
        mockController();
        mockInactiveKeys(1);

        render(<OutgoingRecoveryContactSettings userHasNoAccountRecoveryMethodSet={false} />);

        expect(screen.getByText(lockedDataTitle)).toBeInTheDocument();
        expect(
            screen.getByText(
                "Your data is still locked from a password reset. A contact added now won't be able to restore it.",
                { exact: false }
            )
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Add recovery contact' })).not.toBeInTheDocument();
    });

    it('opens the add recovery contact flow from the locked data warning', async () => {
        const { notify } = mockController();
        mockInactiveKeys(1);

        render(<OutgoingRecoveryContactSettings userHasNoAccountRecoveryMethodSet={false} />);
        await userEvent.click(screen.getByRole('button', { name: 'Add contact' }));

        expect(notify).toHaveBeenCalledWith({ type: 'add', value: 'recovery-contact' });
    });

    it('disables add contact in the locked data warning when a non-sentinel user has no recovery method', () => {
        mockController();
        mockInactiveKeys(1);

        render(<OutgoingRecoveryContactSettings userHasNoAccountRecoveryMethodSet={true} />);

        expect(screen.getByRole('button', { name: 'Add contact' })).toBeDisabled();
    });

    it('keeps add contact in the locked data warning enabled for sentinel users without a recovery method', () => {
        mockController();
        mockInactiveKeys(1);
        mockIsSentinelUser(true);

        render(<OutgoingRecoveryContactSettings userHasNoAccountRecoveryMethodSet={true} />);

        expect(screen.getByRole('button', { name: 'Add contact' })).toBeEnabled();
    });

    it('shows the add recovery contact button instead of the locked data warning when the user dismissed the recover data card', () => {
        mockController();
        mockInactiveKeys(1);
        mockHasDismissedRecoverDataCard(true);

        render(<OutgoingRecoveryContactSettings userHasNoAccountRecoveryMethodSet={false} />);

        expect(screen.getByRole('button', { name: 'Add recovery contact' })).toBeEnabled();
        expect(screen.queryByText(lockedDataTitle)).not.toBeInTheDocument();
    });
});
