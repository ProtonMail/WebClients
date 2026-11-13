import { fireEvent, render, screen } from '@testing-library/react';
import { type MockedFunction, vi } from 'vitest';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import ModalsProvider from '@proton/components/containers/modals/Provider';
import { PRODUCT_BIT } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import { useFlag } from '@proton/unleash/useFlag';

import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '../../constants';
import useBYOEAddressesCounts from '../../hooks/useBYOEAddressesCounts';
import useSetupGmailBYOEAddress from '../../hooks/useSetupGmailBYOEAddress';
import { EASY_SWITCH_SOURCES } from '../../interface';
import type { Sync } from '../../logic/sync/sync.interface';
import ConnectGmailButton from './ConnectGmailButton';

vi.mock('@proton/app-context/useConfig', () => ({
    useConfig: () => ({
        APP_NAME: 'proton-mail',
    }),
}));

vi.mock('@proton/account/user/hooks');
const mockUseUser = useUser as MockedFunction<any>;

vi.mock('@proton/account/addresses/hooks');
const mockUseAddresses = useAddresses as MockedFunction<any>;

vi.mock('../../hooks/useSetupGmailBYOEAddress');
const mockUseSetupGmailBYOEAddress = useSetupGmailBYOEAddress as MockedFunction<any>;

vi.mock('../../hooks/useBYOEAddressesCounts');
const mockUseBYOEAddressesCount = useBYOEAddressesCounts as MockedFunction<any>;

vi.mock('../../logic/store', () => ({
    useEasySwitchDispatch: () => vi.fn(),
}));

// mocking modals because they contain too many hooks
vi.mock('../Modals/GmailSyncModal/GmailSyncModal', () => ({
    __esModule: true,
    default: (props: any) => <div data-testid="GmailSyncModal" {...props} />,
}));

vi.mock('@proton/components/components/upsell/UpsellModal/UpsellModal', () => ({
    __esModule: true,
    default: (props: any) => <div data-testid="UpsellModal" {...props} />,
}));

vi.mock('../../hooks/useBYOEFeatureStatus', () => ({
    __esModule: true,
    default: () => {
        return [true, false] as const;
    },
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({
        createNotification: vi.fn(),
    }),
}));

const mockUseFlag = useFlag as MockedFunction<any>;

describe('ConnectGmailButton', () => {
    beforeEach(() => {
        mockUseFlag.mockReturnValue(false);
        mockUseUser.mockReturnValue([{}, false]);
        mockUseAddresses.mockReturnValue([[], false]);
        mockUseSetupGmailBYOEAddress.mockReturnValue({
            isInMaintenance: false,
            handleSyncCallback: vi.fn(),
            allSyncs: [],
        });
        mockUseBYOEAddressesCount.mockReturnValue({
            isLoadingAddressesCount: false,
            byoeAddresses: [],
            activeBYOEAddresses: [],
            addressesOrSyncs: [],
            forwardingList: [],
            byoeAddressesAvailableCount: 1,
            maxBYOEAddresses: 0,
        });
    });

    it('should render the button with default text', () => {
        render(<ConnectGmailButton source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS} />);
        expect(screen.getByTestId('ProviderButton:googleCardForward')).toHaveTextContent(
            'Set up auto-forwarding from Gmail'
        );
    });

    it('should render a disabled button if user is loading', () => {
        mockUseUser.mockReturnValue([{}, true]);
        render(<ConnectGmailButton showIcon source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS} />);
        expect(screen.getByTestId('ProviderButton:googleCardForward')).toBeDisabled();
    });

    it('should render a disabled button if feature is in maintenance', () => {
        mockUseUser.mockReturnValue([{}, false]);
        mockUseFlag.mockImplementation((flag: string) => flag === 'MaintenanceImporter');
        render(<ConnectGmailButton showIcon source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS} />);
        expect(screen.getByTestId('ProviderButton:googleCardForward')).toBeDisabled();
    });

    it('should open sync modal when clicked and user has quota left', () => {
        mockUseUser.mockReturnValue([{}, false]);
        render(
            <ModalsProvider>
                <ConnectGmailButton showIcon source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS} />
            </ModalsProvider>
        );
        fireEvent.click(screen.getByTestId('ProviderButton:googleCardForward'));
        expect(screen.getByTestId('GmailSyncModal')).toBeInTheDocument();
    });

    it('should open upsell modal when user is free and has a byoe', () => {
        mockUseUser.mockReturnValue([{}, false]);
        mockUseBYOEAddressesCount.mockReturnValue({
            isLoadingAddressesCount: false,
            byoeAddresses: [],
            activeBYOEAddresses: [{ Email: 'test@gmail.com' } as Address],
            addressesOrSyncs: [{ id: 'syncID' } as Sync],
            forwardingList: [],
            byoeAddressesAvailableCount: 0,
            maxBYOEAddresses: MAX_SYNC_FREE_USER,
        });
        render(
            <ModalsProvider>
                <ConnectGmailButton showIcon source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS} />
            </ModalsProvider>
        );
        fireEvent.click(screen.getByTestId('ProviderButton:googleCardForward'));
        expect(screen.getByTestId('UpsellModal')).toBeInTheDocument();
    });

    it('should open conversion modal when user is free and has a sync', () => {
        mockUseSetupGmailBYOEAddress.mockReturnValue({});
        mockUseUser.mockReturnValue([{}, false]);
        mockUseBYOEAddressesCount.mockReturnValue({
            isLoadingAddressesCount: false,
            byoeAddresses: [],
            activeBYOEAddresses: [],
            addressesOrSyncs: [{ id: 'syncID' } as Sync],
            forwardingList: [{ id: 'syncID' } as Sync],
            byoeAddressesAvailableCount: 1,
            maxBYOEAddresses: MAX_SYNC_FREE_USER,
        });
        render(
            <ModalsProvider>
                <ConnectGmailButton showIcon source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS} />
            </ModalsProvider>
        );
        fireEvent.click(screen.getByTestId('ProviderButton:googleCardForward'));
        expect(screen.getByTestId('converstionModal')).toBeInTheDocument();
    });

    it('should open limit modal when paid user has reached byoe limit', () => {
        mockUseUser.mockReturnValue([{ Subscribed: PRODUCT_BIT.MAIL, Flags: { 'has-a-byoe-address': true } }, false]);
        mockUseBYOEAddressesCount.mockReturnValue({
            isLoadingAddressesCount: false,
            byoeAddresses: [],
            activeBYOEAddresses: [
                { Email: 'test@gmail.com' } as Address,
                { Email: 'test2@gmail.com' } as Address,
                { Email: 'test3@gmail.com' } as Address,
            ],
            addressesOrSyncs: [{ id: 'syncID1' } as Sync, { id: 'syncID2' } as Sync, { id: 'syncID3' } as Sync],
            forwardingList: [],
            byoeAddressesAvailableCount: 0,
            maxBYOEAddresses: MAX_SYNC_PAID_USER,
        });
        render(
            <ModalsProvider>
                <ConnectGmailButton showIcon source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS} />
            </ModalsProvider>
        );
        fireEvent.click(screen.getByTestId('ProviderButton:googleCardForward'));
        screen.getByText('Limit reached');
    });

    it('should open conversion modal when paid user has reached sync limit', () => {
        mockUseSetupGmailBYOEAddress.mockReturnValue({});
        mockUseUser.mockReturnValue([{ Subscribed: PRODUCT_BIT.MAIL, Flags: { 'has-a-byoe-address': true } }, false]);
        mockUseBYOEAddressesCount.mockReturnValue({
            isLoadingAddressesCount: false,
            byoeAddresses: [],
            activeBYOEAddresses: [],
            addressesOrSyncs: [{ id: 'syncID1' } as Sync, { id: 'syncID2' } as Sync, { id: 'syncID3' } as Sync],
            forwardingList: [{ id: 'syncID1' } as Sync, { id: 'syncID2' } as Sync, { id: 'syncID3' } as Sync],
            byoeAddressesAvailableCount: 0,
            maxBYOEAddresses: MAX_SYNC_PAID_USER,
        });
        render(
            <ModalsProvider>
                <ConnectGmailButton showIcon source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS} />
            </ModalsProvider>
        );
        fireEvent.click(screen.getByTestId('ProviderButton:googleCardForward'));
        expect(screen.getByTestId('converstionModal')).toBeInTheDocument();
    });
});
