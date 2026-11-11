import { render, screen } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { buildUser } from '@proton/shared/testing/buildUser';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import type { AssistantSubscriptionStatus } from '../../../hooks/assistant/useAssistantSubscriptionStatus';
import useAssistantSubscriptionStatus from '../../../hooks/assistant/useAssistantSubscriptionStatus';
import type { ModalStateProps } from '../../modalTwo/useModalState';
import ComposerAssistantB2CUpsellModal from './ComposerAssistantB2CUpsellModal';

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
jest.mock('@proton/account/user/hooks');

const mockUseAssistantSubscriptionStatus = useAssistantSubscriptionStatus as jest.Mock;
const mockUseFlag = useFlag as jest.Mock;
const mockUseUser = useUser as jest.Mock;

const paidUser = buildUser();
const freeUser = buildUser({ Subscribed: 0, isFree: true, isPaid: false, hasPaidMail: false });

const renderModal = ({
    scribeToLumo,
    user = paidUser,
    trialStatus = 'no-trial',
}: {
    scribeToLumo: boolean;
    user?: UserModel;
    trialStatus?: AssistantSubscriptionStatus['trialStatus'];
}) => {
    mockUseFlag.mockImplementation((name: string) => name === MailFeatureFlag.ScribeToLumo && scribeToLumo);
    mockUseUser.mockReturnValue([user]);
    mockUseAssistantSubscriptionStatus.mockReturnValue({
        canUseAssistant: false,
        trialEndDate: null,
        trialStatus,
        start: jest.fn(),
    });
    render(<ComposerAssistantB2CUpsellModal modalProps={{} as ModalStateProps} />);
};

const getTitle = () => screen.getByRole('heading').textContent;

describe('ComposerAssistantB2CUpsellModal', () => {
    describe('ScribeToLumo on', () => {
        it('tells a user whose trial ended that it ended', () => {
            renderModal({ scribeToLumo: true, trialStatus: 'trial-ended' });
            expect(getTitle()).toBe('Your free trial has ended');
        });

        it('does not mention a trial to a paid user who never had one', () => {
            renderModal({ scribeToLumo: true, trialStatus: 'no-trial' });
            expect(getTitle()).toBe('Craft better emails with Lumo');
        });

        it('offers an upgrade to Lumo', () => {
            renderModal({ scribeToLumo: true });
            expect(
                screen.getByText('For unlimited access to the writing assistant and more, upgrade to Lumo.')
            ).toBeInTheDocument();
        });
    });

    describe('ScribeToLumo off', () => {
        it('tells a paid user their trial ended', () => {
            renderModal({ scribeToLumo: false });
            expect(getTitle()).toBe('Your free trial has ended');
        });

        it('shows the generic title to a free user', () => {
            renderModal({ scribeToLumo: false, user: freeUser });
            expect(getTitle()).toBe('Craft better emails');
        });
    });
});
