import { fireEvent, render, screen } from '@testing-library/react';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import ModalsProvider from '@proton/components/containers/modals/Provider';
import { ADDRESS_FLAGS, APPS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';

import useSetupGmailBYOEAddress from '../../hooks/useSetupGmailBYOEAddress';
import type { Sync } from '../../logic/sync/sync.interface';
import ConnectGmailButton from './ConnectGmailButton';

jest.mock('@proton/components/hooks/useConfig', () => () => ({
    APP_NAME: 'proton-mail',
}));

jest.mock('@proton/account/user/hooks');
const mockUseUser = useUser as jest.MockedFunction<any>;

jest.mock('@proton/account/addresses/hooks');
const mockUseAddresses = useAddresses as jest.MockedFunction<any>;

jest.mock('../../hooks/useSetupGmailBYOEAddress');
const mockUseSetupGmailBYOEAddress = useSetupGmailBYOEAddress as jest.MockedFunction<any>;

// mocking modals because they contain too many hooks
jest.mock('../Modals/GmailSyncModal/GmailSyncModal', () => ({
    __esModule: true,
    default: (props: any) => <div data-testid="GmailSyncModal" {...props} />,
}));

jest.mock('@proton/components/components/upsell/UpsellModal/UpsellModal', () => ({
    __esModule: true,
    default: (props: any) => <div data-testid="UpsellModal" {...props} />,
}));

describe('ConnectGmailButton', () => {
    beforeEach(() => {
        mockUseUser.mockReturnValue([{}, false]);
        mockUseAddresses.mockReturnValue([[], false]);
        mockUseSetupGmailBYOEAddress.mockReturnValue({
            hasAccessToBYOE: false,
            isInMaintenance: false,
            handleSyncCallback: jest.fn(),
            allSyncs: [],
        });
    });

    it('should render the button with default text', () => {
        render(<ConnectGmailButton app={APPS.PROTONMAIL} />);
        expect(screen.getByTestId('ProviderButton:googleCardForward')).toHaveTextContent(
            'Set up auto-forwarding from Gmail'
        );
    });

    it('should render a disabled button if user is loading', () => {
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: true }, true]);
        render(<ConnectGmailButton app={APPS.PROTONMAIL} showIcon />);
        expect(screen.getByTestId('ProviderButton:googleCardForward')).toBeDisabled();
    });

    it('should render a disabled button if user is delinquent', () => {
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: false }, false]);
        render(<ConnectGmailButton app={APPS.PROTONMAIL} showIcon />);
        expect(screen.getByTestId('ProviderButton:googleCardForward')).toBeDisabled();
    });

    it('should render a disabled button if feature is in maintenance', () => {
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: true }, false]);
        mockUseSetupGmailBYOEAddress.mockReturnValue({
            hasAccessToBYOE: false,
            isInMaintenance: true,
            handleSyncCallback: jest.fn(),
            allSyncs: [],
        });
        render(<ConnectGmailButton app={APPS.PROTONMAIL} showIcon />);
        expect(screen.getByTestId('ProviderButton:googleCardForward')).toBeDisabled();
    });

    it('should open sync modal when clicked and user has quota left', () => {
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: true }, false]);
        render(
            <ModalsProvider>
                <ConnectGmailButton app={APPS.PROTONMAIL} showIcon />
            </ModalsProvider>
        );
        fireEvent.click(screen.getByTestId('ProviderButton:googleCardForward'));
        expect(screen.getByTestId('GmailSyncModal')).toBeInTheDocument();
    });

    it('should open upsell modal when user is free and has a sync', () => {
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: true }, false]);
        mockUseSetupGmailBYOEAddress.mockReturnValue({
            hasAccessToBYOE: false,
            isInMaintenance: false,
            handleSyncCallback: jest.fn(),
            allSyncs: [{ id: 'syncID' } as Sync],
        });
        render(
            <ModalsProvider>
                <ConnectGmailButton app={APPS.PROTONMAIL} showIcon />
            </ModalsProvider>
        );
        fireEvent.click(screen.getByTestId('ProviderButton:googleCardForward'));
        expect(screen.getByTestId('UpsellModal')).toBeInTheDocument();
    });

    it('should open upsell limit modal when user has reached sync limit', () => {
        mockUseUser.mockReturnValue([
            { hasNonDelinquentScope: true, Subscribed: {}, Flags: { 'has-a-byoe-address': true } },
            false,
        ]);
        mockUseSetupGmailBYOEAddress.mockReturnValue({
            hasAccessToBYOE: false,
            isInMaintenance: false,
            handleSyncCallback: jest.fn(),
            allSyncs: [{ id: 'syncID1' } as Sync, { id: 'syncID2' } as Sync, { id: 'syncID3' } as Sync],
        });
        render(
            <ModalsProvider>
                <ConnectGmailButton app={APPS.PROTONMAIL} showIcon />
            </ModalsProvider>
        );
        fireEvent.click(screen.getByTestId('ProviderButton:googleCardForward'));
        screen.getByText('Limit reached');
    });

    it('should open upsell limit modal when user has reached BYOE limit', () => {
        mockUseUser.mockReturnValue([
            { hasNonDelinquentScope: true, Subscribed: {}, Flags: { 'has-a-byoe-address': true } },
            false,
        ]);
        mockUseSetupGmailBYOEAddress.mockReturnValue({
            hasAccessToBYOE: false,
            isInMaintenance: false,
            handleSyncCallback: jest.fn(),
            allSyncs: [{ id: 'syncID1' } as Sync, { id: 'syncID2' } as Sync, { id: 'syncID3' } as Sync],
        });
        mockUseAddresses.mockReturnValue([
            [
                { ID: 'address1', Flags: ADDRESS_FLAGS.BYOE } as Address,
                { ID: 'address2', Flags: ADDRESS_FLAGS.BYOE } as Address,
                { ID: 'address3', Flags: ADDRESS_FLAGS.BYOE } as Address,
            ],
            false,
        ]);
        render(
            <ModalsProvider>
                <ConnectGmailButton app={APPS.PROTONMAIL} showIcon />
            </ModalsProvider>
        );
        fireEvent.click(screen.getByTestId('ProviderButton:googleCardForward'));
        screen.getByText('Limit reached');
    });

    it('should open upsell limit modal when user has reached BYOE limit and deleted syncs', () => {
        mockUseUser.mockReturnValue([
            { hasNonDelinquentScope: true, Subscribed: {}, Flags: { 'has-a-byoe-address': true } },
            false,
        ]);
        mockUseSetupGmailBYOEAddress.mockReturnValue({
            hasAccessToBYOE: false,
            isInMaintenance: false,
            handleSyncCallback: jest.fn(),
            allSyncs: [{ id: 'syncID1' } as Sync],
        });
        mockUseAddresses.mockReturnValue([
            [
                { ID: 'address1', Flags: ADDRESS_FLAGS.BYOE } as Address,
                { ID: 'address2', Flags: ADDRESS_FLAGS.BYOE } as Address,
                { ID: 'address3', Flags: ADDRESS_FLAGS.BYOE } as Address,
            ],
            false,
        ]);
        render(
            <ModalsProvider>
                <ConnectGmailButton app={APPS.PROTONMAIL} showIcon />
            </ModalsProvider>
        );
        fireEvent.click(screen.getByTestId('ProviderButton:googleCardForward'));
        screen.getByText('Limit reached');
    });
});
