import { fireEvent, render, screen } from '@testing-library/react';

import { PLANS } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';
import { mockUseOrganization } from '@proton/testing';
import { mockNotifications } from '@proton/testing/lib/mockNotifications';
import { mockUseApi } from '@proton/testing/lib/mockUseApi';
import { mockUseMailSettings } from '@proton/testing/lib/mockUseMailSettings';
import { mockUseUser } from '@proton/testing/lib/mockUseUser';
import { mockUseUserSettings } from '@proton/testing/lib/mockUseUserSettings';

import PMSignatureField from './PMSignatureField';

jest.mock('@proton/components/hooks/useNotifications', () => () => mockNotifications);

jest.mock('@proton/components/hooks/useConfig', () => () => ({
    APP_NAME: APPS.PROTONACCOUNT,
}));

jest.mock('@proton/components/components/upsell/UpsellModal/UpsellModal', () => (props: any) => {
    return <div data-testid="upsell-modal">{props.title || 'Upsell Modal'}</div>;
});

jest.mock('@proton/account');
jest.mock('@proton/account/user/hooks');
jest.mock('@proton/mail/store/mailSettings/hooks');
jest.mock('@proton/account/organization/hooks');
jest.mock('@proton/components/hooks/useApi');
jest.mock('@proton/redux-shared-store', () => ({ useDispatch: () => jest.fn() }));
jest.mock('@proton/components/hooks/useToggle', () => () => ({ state: false, toggle: jest.fn() }));
jest.mock('@proton/hooks', () => ({ useLoading: () => [false, (fn: any) => fn] }));
jest.mock('@proton/components/components/modalTwo/useModalState', () => () => [{}, jest.fn(), true]);

describe('PMSignatureField', () => {
    const id = 'pmSignatureToggle';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('enables the toggle for free user (regardless of PMSignature state)', () => {
        mockUseUser([{ hasPaidMail: false }]);
        mockUseMailSettings([{ PMSignature: PM_SIGNATURE.LOCKED }]);
        mockUseUserSettings();
        mockUseOrganization();
        render(<PMSignatureField id={id} />);
        const toggle = screen.getByRole('checkbox');
        expect(toggle).not.toBeDisabled();
    });

    it('enables the toggle for paid user if PMSignature is not locked', () => {
        mockUseUser([{ hasPaidMail: true }]);
        mockUseMailSettings([{ PMSignature: PM_SIGNATURE.ENABLED }]);
        mockUseUserSettings();
        mockUseOrganization();
        render(<PMSignatureField id={id} />);
        const toggle = screen.getByRole('checkbox');
        expect(toggle).not.toBeDisabled();
    });

    it('disables the toggle for paid user if PMSignature is locked', () => {
        mockUseUser([{ hasPaidMail: true }]);
        mockUseMailSettings([{ PMSignature: PM_SIGNATURE.LOCKED }]);
        mockUseUserSettings();
        mockUseOrganization();
        render(<PMSignatureField id={id} />);
        const toggle = screen.getByRole('checkbox');
        expect(toggle).toBeDisabled();
    });

    it('disables the toggle for paid user if user is member', () => {
        mockUseUser([{ hasPaidMail: true, isMember: true }]);
        mockUseMailSettings([{ PMSignature: PM_SIGNATURE.ENABLED }]);
        mockUseUserSettings();
        mockUseOrganization();
        render(<PMSignatureField id={id} />);
        const toggle = screen.getByRole('checkbox');
        expect(toggle).toBeDisabled();
    });

    it('calls API and notification when paid user toggles', () => {
        mockUseUser([{ hasPaidMail: true }]);
        mockUseMailSettings([{ PMSignature: PM_SIGNATURE.ENABLED }]);
        mockUseUserSettings();
        mockUseOrganization();
        const mockApi = jest.fn().mockResolvedValue({ MailSettings: {} });
        mockUseApi(mockApi);
        render(<PMSignatureField id={id} />);
        const toggle = screen.getByRole('checkbox');
        fireEvent.click(toggle!);
        expect(mockApi).toHaveBeenCalled();
    });

    it('shows upsell modal when free user toggles', () => {
        mockUseUser([{ hasPaidMail: false }]);
        mockUseMailSettings([{ PMSignature: PM_SIGNATURE.ENABLED }]);
        mockUseUserSettings();
        mockUseOrganization();
        render(<PMSignatureField id={id} />);
        const toggle = screen.getByRole('checkbox');
        fireEvent.click(toggle!);
        // Modal is rendered if renderUpsellModal is true (see mock)
        expect(screen.getByTestId('upsell-modal')).toBeInTheDocument();
    });

    it('enable the toggle for users member of a family organization', () => {
        mockUseUser([{ hasPaidMail: true, isMember: true }]);
        mockUseMailSettings([{ PMSignature: PM_SIGNATURE.ENABLED }]);
        mockUseUserSettings();
        mockUseOrganization([{ PlanName: PLANS.FAMILY }]);
        render(<PMSignatureField id={id} />);
        const toggle = screen.getByRole('checkbox');
        expect(toggle).toBeEnabled();
    });

    it('enable the toggle for users member of a duo organization', () => {
        mockUseUser([{ hasPaidMail: true, isMember: true }]);
        mockUseMailSettings([{ PMSignature: PM_SIGNATURE.ENABLED }]);
        mockUseUserSettings();
        mockUseOrganization([{ PlanName: PLANS.FAMILY }]);
        render(<PMSignatureField id={id} />);
        const toggle = screen.getByRole('checkbox');
        expect(toggle).toBeEnabled();
    });

    it('disable the toggle for users member of a mail pro organization', () => {
        mockUseUser([{ hasPaidMail: true, isMember: true }]);
        mockUseMailSettings([{ PMSignature: PM_SIGNATURE.ENABLED }]);
        mockUseUserSettings();
        mockUseOrganization([{ PlanName: PLANS.MAIL_PRO }]);
        render(<PMSignatureField id={id} />);
        const toggle = screen.getByRole('checkbox');
        expect(toggle).toBeDisabled();
    });

    it('disable the toggle for users member of a mail business organization', () => {
        mockUseUser([{ hasPaidMail: true, isMember: true }]);
        mockUseMailSettings([{ PMSignature: PM_SIGNATURE.ENABLED }]);
        mockUseUserSettings();
        mockUseOrganization([{ PlanName: PLANS.MAIL_BUSINESS }]);
        render(<PMSignatureField id={id} />);
        const toggle = screen.getByRole('checkbox');
        expect(toggle).toBeDisabled();
    });

    it('shows nothing if loading data', () => {
        mockUseUser([{ hasPaidMail: true }]);
        mockUseMailSettings([{ PMSignature: PM_SIGNATURE.ENABLED }, true]);
        mockUseUserSettings([{}, true]);
        mockUseOrganization([{}, true]);
        render(<PMSignatureField id={id} />);
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });
});
