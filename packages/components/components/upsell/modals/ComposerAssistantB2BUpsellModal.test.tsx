import { render, screen } from '@testing-library/react';

import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import type { AssistantSubscriptionStatus } from '../../../hooks/assistant/useAssistantSubscriptionStatus';
import useAssistantSubscriptionStatus from '../../../hooks/assistant/useAssistantSubscriptionStatus';
import type { ModalStateProps } from '../../modalTwo/useModalState';
import ComposerAssistantB2BUpsellModal from './ComposerAssistantB2BUpsellModal';

jest.mock('../UpsellModal/UpsellModal', () => ({
    __esModule: true,
    default: ({ title, description }: { title: string; description: React.ReactNode }) => (
        <>
            <h1>{title}</h1>
            <div>{description}</div>
        </>
    ),
}));
jest.mock('../UpsellFeatureList', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../hooks/assistant/useAssistantSubscriptionStatus');
jest.mock('@proton/unleash/useFlag');

const mockUseAssistantSubscriptionStatus = useAssistantSubscriptionStatus as jest.Mock;
const mockUseFlag = useFlag as jest.Mock;

const renderModal = ({
    scribeToLumo,
    trialStatus,
    isOrgUser,
}: {
    scribeToLumo: boolean;
    trialStatus: AssistantSubscriptionStatus['trialStatus'];
    isOrgUser?: boolean;
}) => {
    mockUseFlag.mockImplementation((name: string) => name === MailFeatureFlag.ScribeToLumo && scribeToLumo);
    mockUseAssistantSubscriptionStatus.mockReturnValue({
        canUseAssistant: false,
        trialEndDate: null,
        trialStatus,
        start: jest.fn(),
    });
    render(<ComposerAssistantB2BUpsellModal modalProps={{} as ModalStateProps} isOrgUser={isOrgUser} />);
};

const getTitle = () => screen.getByRole('heading').textContent;

describe('ComposerAssistantB2BUpsellModal', () => {
    describe('ScribeToLumo on', () => {
        it('tells a user whose trial ended that it ended', () => {
            renderModal({ scribeToLumo: true, trialStatus: 'trial-ended' });
            expect(getTitle()).toBe('Your free trial has ended');
        });

        it('does not mention a trial to a user who never had one', () => {
            renderModal({ scribeToLumo: true, trialStatus: 'no-trial' });
            expect(getTitle()).toBe('Craft better emails with Lumo');
        });

        it('sends an admin with no trial to their subscription', () => {
            renderModal({ scribeToLumo: true, trialStatus: 'no-trial' });
            expect(screen.getByText('To use Lumo in Proton Mail, add it to your subscription.')).toBeInTheDocument();
        });

        it('sends an org user with no trial to their admin', () => {
            renderModal({ scribeToLumo: true, trialStatus: 'no-trial', isOrgUser: true });
            expect(screen.getByText('To use Lumo in Proton Mail, request access from your admin.')).toBeInTheDocument();
        });
    });

    describe('ScribeToLumo off', () => {
        it('tells every user their trial ended', () => {
            renderModal({ scribeToLumo: false, trialStatus: 'no-trial' });
            expect(getTitle()).toBe('Your free trial has ended');
        });
    });
});
