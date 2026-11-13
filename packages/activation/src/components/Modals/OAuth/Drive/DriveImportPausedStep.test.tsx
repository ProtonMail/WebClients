import { fireEvent, screen, waitFor } from '@testing-library/dom';
import { type Mock, vi } from 'vitest';

import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { SubscriptionModalContext } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';

import { ApiImportProvider, ApiImporterError } from '../../../../api/api.interface';
import { useReconnectOAuthImport } from '../../../../hooks/useReconnectOAuthImport';
import { ImportType } from '../../../../interface';
import type { Importer } from '../../../../logic/importers/importers.interface';
import { easySwitchRender } from '../../../../tests/render';
import { DriveImportPausedStep } from './DriveImportPausedStep';

// useSettingsLink pulls in navigation/authentication context this test doesn't set up - stub it.
vi.mock('@proton/components/components/link/useSettingsLink', () => ({
    __esModule: true,
    default: vi.fn(),
}));

// The reconnect flow calls the API and opens the Google OAuth popup - stub it.
vi.mock('../../../../hooks/useReconnectOAuthImport', () => ({
    useReconnectOAuthImport: vi.fn(),
}));

const mockUseSettingsLink = useSettingsLink as Mock;
const reconnectOAuthImport = vi.fn();
vi.mocked(useReconnectOAuthImport).mockReturnValue({ reconnectOAuthImport, loadingConfig: false });

const importer: Importer = {
    ID: 'importer-id',
    account: 'user@gmail.com',
    products: [ImportType.DRIVE],
    provider: ApiImportProvider.GOOGLE,
};

describe('DriveImportPausedStep', () => {
    it('lets the user dismiss the modal without navigating away', () => {
        const goToSettings = vi.fn();
        const onClose = vi.fn();
        mockUseSettingsLink.mockReturnValue(goToSettings);

        easySwitchRender(<DriveImportPausedStep importer={importer} onClose={onClose} />);
        fireEvent.click(screen.getByText('Dismiss'));

        expect(onClose).toHaveBeenCalled();
        expect(goToSettings).not.toHaveBeenCalled();
    });

    it('lets the user upgrade, closing the modal and navigating to the upgrade page', () => {
        const goToSettings = vi.fn();
        const onClose = vi.fn();
        mockUseSettingsLink.mockReturnValue(goToSettings);

        easySwitchRender(<DriveImportPausedStep importer={importer} onClose={onClose} />);
        fireEvent.click(screen.getByText('Upgrade'));

        expect(onClose).toHaveBeenCalled();
        expect(goToSettings).toHaveBeenCalledWith('/upgrade');
    });

    it('lets the user upgrade in the plan selection modal when the app provides it', () => {
        const goToSettings = vi.fn();
        const openSubscriptionModal = vi.fn();
        const onClose = vi.fn();
        mockUseSettingsLink.mockReturnValue(goToSettings);

        easySwitchRender(
            <SubscriptionModalContext.Provider value={[openSubscriptionModal, false, true]}>
                <DriveImportPausedStep importer={importer} onClose={onClose} />
            </SubscriptionModalContext.Provider>
        );
        fireEvent.click(screen.getByText('Upgrade'));

        expect(onClose).toHaveBeenCalled();
        expect(openSubscriptionModal).toHaveBeenCalledWith({ step: SUBSCRIPTION_STEPS.PLAN_SELECTION });
        expect(goToSettings).not.toHaveBeenCalled();
    });

    it('asks the user to reconnect when the import was paused by a connection error', async () => {
        const onClose = vi.fn();
        reconnectOAuthImport.mockResolvedValue(undefined);

        easySwitchRender(
            <DriveImportPausedStep
                importer={importer}
                errorCode={ApiImporterError.ERROR_CODE_IMAP_CONNECTION}
                onClose={onClose}
            />
        );
        expect(screen.queryByText('Upgrade')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Reconnect'));

        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(reconnectOAuthImport).toHaveBeenCalledWith(importer, ImportType.DRIVE);
    });
});
