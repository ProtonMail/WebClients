import { screen } from '@testing-library/react';
import { addDays } from 'date-fns';
import type { MockedFunction } from 'vitest';

import EasySwitchProvider from '@proton/activation/src/logic/StoreProvider';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces/Checklist';

import type { OnboardingChecklistContext } from '../../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { useGetStartedChecklist } from '../../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { mailTestRender } from '../../../helpers/tests/render';
import MailboxContainerPlaceholder from '../MailboxContainerPlaceholder';

vi.mock('../../../containers/onboardingChecklist/provider/GetStartedChecklistProvider', () => ({
    __esModule: true,
    useGetStartedChecklist: vi.fn(),
    default: ({ children }: { children: any }) => <>{children}</>,
}));

const mockedReturn = useGetStartedChecklist as MockedFunction<typeof useGetStartedChecklist>;

describe('MailboxContainerPlaceholder', () => {
    it('Should display checklist when no mails are present', async () => {
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
            itemsToComplete: ['Import'],
        } as OnboardingChecklistContext);

        await mailTestRender(
            <EasySwitchProvider>
                <MailboxContainerPlaceholder
                    showPlaceholder={true}
                    welcomeFlag={false}
                    checkedIDs={[]}
                    handleCheckAll={vi.fn() as any}
                />
            </EasySwitchProvider>
        );
        screen.getByTestId('onboarding-importers');
    });

    it('Should display section pane when checklist is reduced', async () => {
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.REDUCED,
            items: new Set(),
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
        } as OnboardingChecklistContext);

        await mailTestRender(
            <MailboxContainerPlaceholder
                showPlaceholder={true}
                welcomeFlag={false}
                checkedIDs={[]}
                handleCheckAll={vi.fn() as any}
            />
        );
        screen.getByTestId('section-pane--wrapper');
    });

    it('Should display section pane when checklist is hidden', async () => {
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.HIDDEN,
            items: new Set(),
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
        } as OnboardingChecklistContext);

        await mailTestRender(
            <MailboxContainerPlaceholder
                showPlaceholder={true}
                welcomeFlag={false}
                checkedIDs={[]}
                handleCheckAll={vi.fn() as any}
            />
        );
        screen.getByTestId('section-pane--wrapper');
    });
});
