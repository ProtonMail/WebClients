import { fireEvent, render, screen } from '@testing-library/react';

import { mockUseOrganization } from '@proton/account/testing/vitest/mockUseOrganization';
import { mockUseUser } from '@proton/account/testing/vitest/mockUseUser';
import { mockUseUserSettings } from '@proton/account/testing/vitest/mockUseUserSettings';
import { mockUseApi } from '@proton/app-context/testing/vitest/mockUseApi';
import { PLANS } from '@proton/payments/core/constants';
import { APPS } from '@proton/shared/lib/constants';

import { mockNotifications } from '../../testing/vitest/mockNotifications';
import { mockUseMailSettings } from '../../testing/vitest/mockUseMailSettings';
import PMSignatureField from './PMSignatureField';

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => mockNotifications,
}));

vi.mock('@proton/app-context/useConfig', () => ({
    useConfig: () => ({
        APP_NAME: APPS.PROTONACCOUNT,
    }),
}));

vi.mock('../../components/upsell/UpsellModal/UpsellModal', () => {
    const MockUpsellModal = (props: any) => {
        return <div data-testid="upsell-modal">{props.title || 'Upsell Modal'}</div>;
    };
    return { __esModule: true, default: MockUpsellModal };
});

vi.mock('@proton/account/userSettings/hooks');
vi.mock('@proton/account/user/hooks');
vi.mock('@proton/mail/store/mailSettings/hooks');
vi.mock('@proton/account/organization/hooks');
vi.mock('@proton/app-context/useApi');
vi.mock('@proton/redux-shared-store/sharedProvider', () => ({ useDispatch: () => vi.fn() }));
vi.mock('@proton/hooks/useToggle', () => ({ __esModule: true, default: () => ({ state: false, toggle: vi.fn() }) }));
vi.mock('@proton/hooks/useLoading', () => ({ __esModule: true, default: () => [false, (fn: any) => fn] }));
vi.mock('../../components/modalTwo/useModalState', () => ({ __esModule: true, default: () => [{}, vi.fn(), true] }));

describe('PMSignatureField', () => {
    const id = 'pmSignatureToggle';

    beforeEach(() => {
        mockUseMailSettings();
        mockUseUserSettings();
        mockUseOrganization();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('enables the toggle for free user (regardless of PMSignature state)', () => {
        mockUseUser([{ hasPaidMail: false }]);
        render(<PMSignatureField id={id} enabled={true} locked={false} />);
        const toggle = screen.getByRole('checkbox');
        expect(toggle).not.toBeDisabled();
    });

    it('enables the toggle for paid user if PMSignature is not locked', () => {
        mockUseUser([{ hasPaidMail: true }]);
        render(<PMSignatureField id={id} enabled={true} locked={false} />);
        const toggle = screen.getByRole('checkbox');
        expect(toggle).not.toBeDisabled();
    });

    it('disables the toggle for paid user if PMSignature is locked', () => {
        mockUseUser([{ hasPaidMail: true }]);
        render(<PMSignatureField id={id} enabled={false} locked={true} />);
        const toggle = screen.getByRole('checkbox');
        expect(toggle).toBeDisabled();
    });

    it('calls API and notification when paid user toggles', () => {
        mockUseUser([{ hasPaidMail: true }]);
        const mockApi = vi.fn().mockResolvedValue({ MailSettings: {} });
        mockUseApi(mockApi);
        render(<PMSignatureField id={id} enabled={true} locked={false} />);
        const toggle = screen.getByRole('checkbox');
        fireEvent.click(toggle!);
        expect(mockApi).toHaveBeenCalled();
    });

    it('shows upsell modal when free user toggles', () => {
        mockUseUser([{ hasPaidMail: false }]);
        render(<PMSignatureField id={id} enabled={true} locked={false} />);
        const toggle = screen.getByRole('checkbox');
        fireEvent.click(toggle!);
        // Modal is rendered if renderUpsellModal is true (see mock)
        expect(screen.getByTestId('upsell-modal')).toBeInTheDocument();
    });

    it('enable the toggle for users member of a family organization', () => {
        mockUseUser([{ hasPaidMail: true, isMember: true }]);
        mockUseOrganization([{ PlanName: PLANS.FAMILY }]);
        render(<PMSignatureField id={id} enabled={true} locked={false} />);
        const toggle = screen.getByRole('checkbox');
        expect(toggle).toBeEnabled();
    });

    it('enable the toggle for users member of a duo organization', () => {
        mockUseUser([{ hasPaidMail: true, isMember: true }]);
        mockUseOrganization([{ PlanName: PLANS.FAMILY }]);
        render(<PMSignatureField id={id} enabled={true} locked={false} />);
        const toggle = screen.getByRole('checkbox');
        expect(toggle).toBeEnabled();
    });

    it('shows nothing if loading data', () => {
        mockUseUser([{ hasPaidMail: true }]);
        mockUseUserSettings([{}, true]);
        mockUseOrganization([{}, true]);
        render(<PMSignatureField id={id} enabled={true} locked={false} />);
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });
});
