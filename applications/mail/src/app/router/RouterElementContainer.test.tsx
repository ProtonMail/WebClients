import { screen } from '@testing-library/react';
import type { MockedFunction } from 'vitest';

import { getModelState } from '@proton/account/testing/getModelState';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces/Checklist';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import { buildUser } from '@proton/shared/testing/buildUser';
import { useFlag } from '@proton/unleash/useFlag';

import type { OnboardingChecklistContext } from '../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import * as GetStartedChecklistProviderModule from '../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { mailTestRender } from '../helpers/tests/render';
import { newElementsState } from '../store/elements/elementsSlice';
import { useMailboxLayoutProvider } from './components/MailboxLayoutContext';

vi.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as MockedFunction<typeof useFlag>;

vi.mock('../containers/onboardingChecklist/provider/GetStartedChecklistProvider', async () => ({
    __esModule: true,
    ...(await vi.importActual('../containers/onboardingChecklist/provider/GetStartedChecklistProvider')),
    useGetStartedChecklist: vi.fn(),
}));

describe('RouterElementContainer - Conversation View Mode', () => {
    let mockedUseGetStartedChecklist: MockedFunction<typeof GetStartedChecklistProviderModule.useGetStartedChecklist>;

    beforeEach(() => {
        mockedUseGetStartedChecklist = vi.mocked(GetStartedChecklistProviderModule.useGetStartedChecklist);
        mockedUseGetStartedChecklist.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
        } as OnboardingChecklistContext);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should force message view for Deleted folder regardless of ViewMode setting', async () => {
        mockUseFlag.mockImplementation((flag) => {
            if (flag === 'DataRetentionPolicy') {
                return true;
            }
            return false;
        });

        const TestComponent = () => {
            const { isConversationGroupingEnabled } = useMailboxLayoutProvider();
            return (
                <div>
                    <div data-testid="conversation-view-mode">{isConversationGroupingEnabled.toString()}</div>
                </div>
            );
        };

        await mailTestRender(<TestComponent />, {
            preloadedState: {
                user: getModelState(buildUser({ ID: undefined, isAdmin: true })),
                mailSettings: getModelState({
                    ViewMode: VIEW_MODE.GROUP, // Conversation mode
                } as MailSettings),
                elements: newElementsState({
                    params: {
                        labelID: MAILBOX_LABEL_IDS.SOFT_DELETED,
                    },
                }),
            },
        });

        expect(screen.getByTestId('conversation-view-mode')).toHaveTextContent('false');
    });

    it('should force message view for Deleted folder regardless of ViewMode setting', async () => {
        mockUseFlag.mockImplementation((flag) => {
            if (flag === 'DataRetentionPolicy') {
                return true;
            }
            return false;
        });

        const TestComponent = () => {
            const { isConversationGroupingEnabled } = useMailboxLayoutProvider();
            return (
                <div>
                    <div data-testid="conversation-view-mode">{isConversationGroupingEnabled.toString()}</div>
                </div>
            );
        };

        await mailTestRender(<TestComponent />, {
            preloadedState: {
                user: getModelState(buildUser({ ID: undefined, isAdmin: true })),
                mailSettings: getModelState({
                    ViewMode: VIEW_MODE.GROUP, // Conversation mode
                } as MailSettings),
                elements: newElementsState({
                    params: {
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                    },
                }),
            },
        });

        expect(screen.getByTestId('conversation-view-mode')).toHaveTextContent('true');
    });
});
