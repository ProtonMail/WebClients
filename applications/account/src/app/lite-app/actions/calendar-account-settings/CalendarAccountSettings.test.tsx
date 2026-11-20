import { fireEvent, render, screen } from '@testing-library/react';

import { useUpdateAccountRecovery } from '@proton/account-recovery/recovery/useUpdateAccountRecovery';
import { useAddresses } from '@proton/account/addresses/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import ConfigProvider from '@proton/components/containers/config/Provider';
import { APPS } from '@proton/shared/lib/constants';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';

import CalendarAccountSettings from './CalendarAccountSettings';

const mockEmailToggle = vi.fn();

vi.mock('@proton/account/addresses/hooks', () => ({ useAddresses: vi.fn() }));
vi.mock('@proton/account/userSettings/hooks', () => ({ useUserSettings: vi.fn() }));
vi.mock('@proton/account-recovery/recovery/useUpdateAccountRecovery', () => ({
    useUpdateAccountRecovery: vi.fn(),
}));
vi.mock('@proton/components/hooks/useMyCountry', () => ({ __esModule: true, default: () => 'CH' }));
vi.mock('@proton/shared/lib/helpers/address', () => ({ getIsBYOEOnlyAccount: vi.fn() }));
vi.mock('../../components/Address/useDefaultAddress', () => ({
    useDefaultAddress: () => ({ defaultAddress: undefined, options: [], saving: false, setDefaultAddress: vi.fn() }),
}));
vi.mock('@proton/components/containers/recovery/useQrCodeSignInToggle', () => ({
    useQrCodeSignInToggle: () => ({ checked: true, loading: false, onChange: vi.fn() }),
}));

// Controls that save on their own are covered by their own tests; only their presence matters here
vi.mock('@proton/components/components/selectTwo/SelectTwo', () => ({
    __esModule: true,
    default: ({ id }: { id: string }) => <div id={id} />,
}));
vi.mock('@proton/components/containers/privacy/CrashReportsToggle', () => ({
    __esModule: true,
    default: ({ id }: { id: string }) => <div id={id} />,
}));
vi.mock('@proton/components/containers/privacy/TelemetryToggle', () => ({
    __esModule: true,
    default: ({ id }: { id: string }) => <div id={id} />,
}));
vi.mock('@proton/components/containers/recovery/email/RecoveryEmail', () => ({
    __esModule: true,
    default: () => <div id="recovery-email-input" />,
}));
vi.mock('@proton/components/containers/recovery/phone/RecoveryPhone', () => ({
    __esModule: true,
    default: () => <div id="phoneInput" />,
}));

const mockedUseAddresses = vi.mocked(useAddresses);
const mockedUseUserSettings = vi.mocked(useUserSettings);
const mockedUseUpdateAccountRecovery = vi.mocked(useUpdateAccountRecovery);
const mockedGetIsBYOEOnlyAccount = vi.mocked(getIsBYOEOnlyAccount);

const mockRecovery = (loading = false) => {
    const toggleProps = { checked: false, loading: false, onChange: vi.fn() };
    mockedUseUpdateAccountRecovery.mockReturnValue({
        el: <div>recovery modals</div>,
        data: { loading },
        recoveryEmail: { props: {}, toggleProps: { ...toggleProps, onChange: mockEmailToggle } },
        recoveryPhone: { props: {}, toggleProps },
    } as any);
};

const renderPage = () =>
    render(
        <ConfigProvider config={{ APP_NAME: APPS.PROTONACCOUNT } as ProtonConfig}>
            <CalendarAccountSettings layout={(children) => children} loader={<div>loader</div>} />
        </ConfigProvider>
    );

const controlIds = [
    'addressSelector',
    'crashReports',
    'telemetry',
    'edmToggle',
    'recovery-email-input',
    'passwordEmailResetToggle',
    'phoneInput',
    'passwordPhoneResetToggle',
];

describe('CalendarAccountSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseAddresses.mockReturnValue([[], false]);
        mockedUseUserSettings.mockReturnValue([{} as any, false, undefined]);
        mockedGetIsBYOEOnlyAccount.mockReturnValue(false);
        mockRecovery();
    });

    it('renders the loader while addresses load', () => {
        mockedUseAddresses.mockReturnValue([undefined as any, true]);
        renderPage();

        expect(screen.getByText('loader')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Account recovery' })).not.toBeInTheDocument();
    });

    it('renders the loader while user settings load', () => {
        mockedUseUserSettings.mockReturnValue([undefined as any, true, undefined]);
        renderPage();

        expect(screen.getByText('loader')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Account recovery' })).not.toBeInTheDocument();
    });

    it('renders the loader while recovery data loads', () => {
        mockRecovery(true);
        renderPage();

        expect(screen.getByText('loader')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Account recovery' })).not.toBeInTheDocument();
    });

    it('renders every account setting', () => {
        const { container } = renderPage();

        ['Email address', 'Account recovery', 'Data collection'].forEach((title) => {
            expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
        });
        controlIds.forEach((id) => {
            expect(container.querySelector(`#${id}`)).toBeInTheDocument();
        });
    });

    it('hides the default address for BYOE-only accounts', () => {
        mockedGetIsBYOEOnlyAccount.mockReturnValue(true);
        const { container } = renderPage();

        expect(container.querySelector('#addressSelector')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Email address' })).not.toBeInTheDocument();
    });

    it('mounts the account recovery modals', () => {
        renderPage();

        expect(screen.getByText('recovery modals')).toBeInTheDocument();
    });

    it('toggles recovery by email', () => {
        const { container } = renderPage();

        fireEvent.click(container.querySelector('#passwordEmailResetToggle')!);

        expect(mockEmailToggle).toHaveBeenCalledTimes(1);
    });

    it('has no display name or signature rows', () => {
        renderPage();

        expect(screen.queryByText('Display name')).not.toBeInTheDocument();
        expect(screen.queryByText('Signature')).not.toBeInTheDocument();
    });
});
