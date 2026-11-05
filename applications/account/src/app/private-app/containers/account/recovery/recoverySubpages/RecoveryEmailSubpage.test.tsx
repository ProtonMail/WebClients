import { fireEvent, render, screen } from '@testing-library/react';

import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import { useUpdateAccountRecovery } from '@proton/account/recovery/useUpdateAccountRecovery';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';

import RecoveryEmailSubpage from './RecoveryEmailSubpage';

jest.mock('@proton/account/recovery/sentinelHooks');
jest.mock('@proton/account/recovery/useUpdateAccountRecovery');
jest.mock('@proton/components/containers/themes/ThemeProvider');
jest.mock('@proton/components/containers/recovery/email/RecoveryEmail', () => ({
    __esModule: true,
    default: () => {
        return null;
    },
}));
jest.mock('@proton/components/containers/recovery/LastChanged', () => ({
    LastChanged: () => {
        return null;
    },
}));

const mockUseIsSentinelUser = jest.mocked(useIsSentinelUser);
const mockUseUpdateAccountRecovery = useUpdateAccountRecovery as jest.Mock;
const mockUseTheme = useTheme as jest.Mock;

const DESCRIPTION = 'If disabled, Proton will still use your recovery email to send security notifications.';
const SENTINEL_DISABLE_WARNING = 'To ensure the highest possible security of your account, disable Recovery by email.';

// The warning is split across a <strong> element, so match on the paragraph's full text content.
const matchSentinelDisableWarning = (_content: string, element: Element | null) => {
    return element?.tagName === 'P' && element.textContent === SENTINEL_DISABLE_WARNING;
};

interface SetupOptions {
    isSentinelUser: boolean;
    hasReset: boolean;
}

const setup = ({ isSentinelUser, hasReset }: SetupOptions) => {
    const onChange = jest.fn();
    mockUseIsSentinelUser.mockReturnValue([{ isSentinelUser } as ReturnType<typeof useIsSentinelUser>[0], false]);
    mockUseTheme.mockReturnValue({ information: { dark: false } });
    mockUseUpdateAccountRecovery.mockReturnValue({
        el: null,
        data: {
            loading: false,
            emailRecovery: {
                value: 'recovery@example.com',
                isVerified: true,
                hasReset,
                legacyEnabled: hasReset,
                updateTime: 0,
            },
        },
        recoveryEmail: {
            handleChangeEmailValue: jest.fn(),
            toggleProps: { checked: hasReset, onChange, loading: false },
            props: {},
        },
    });

    render(<RecoveryEmailSubpage />);

    return { onChange, toggle: document.getElementById('passwordEmailResetToggle') as HTMLInputElement };
};

describe('RecoveryEmailSubpage', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('lets a Sentinel user enable recovery by email', () => {
        const { toggle } = setup({ isSentinelUser: true, hasReset: false });

        expect(toggle).not.toBeDisabled();
        expect(toggle).not.toBeChecked();
        expect(screen.getByText(DESCRIPTION)).toBeInTheDocument();
        expect(screen.queryByText(/not available while/)).not.toBeInTheDocument();
        expect(screen.queryByText(matchSentinelDisableWarning)).not.toBeInTheDocument();
    });

    it('shows the Sentinel warning when a Sentinel user has recovery by email enabled', () => {
        const { toggle } = setup({ isSentinelUser: true, hasReset: true });

        expect(toggle).toBeChecked();
        expect(toggle).not.toBeDisabled();
        expect(screen.getByText(DESCRIPTION)).toBeInTheDocument();
        expect(screen.getByText(matchSentinelDisableWarning)).toBeInTheDocument();
    });

    it('shows the same description and no warning for a non-Sentinel user', () => {
        const { toggle } = setup({ isSentinelUser: false, hasReset: false });

        expect(toggle).not.toBeDisabled();
        expect(screen.getByText(DESCRIPTION)).toBeInTheDocument();
        expect(screen.queryByText(matchSentinelDisableWarning)).not.toBeInTheDocument();
    });

    it('calls the toggle handler when a Sentinel user enables recovery by email', () => {
        const { toggle, onChange } = setup({ isSentinelUser: true, hasReset: false });

        fireEvent.click(toggle);

        expect(onChange).toHaveBeenCalledTimes(1);
    });
});
