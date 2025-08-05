import { screen } from '@testing-library/react';
import { addDays } from 'date-fns';

import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import type { OnboardingChecklistContext } from '../../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { useGetStartedChecklist } from '../../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { mailTestRender } from '../../../helpers/test/helper';
import MailboxContainerPlaceholder from '../MailboxContainerPlaceholder';

jest.mock('../../../containers/onboardingChecklist/provider/GetStartedChecklistProvider', () => ({
    __esModule: true,
    useGetStartedChecklist: jest.fn(),
    default: ({ children }: { children: any }) => <>{children}</>,
}));

jest.mock('@proton/unleash/useVariant', () => ({
    __esModule: true,
    default: jest.fn(() => ({ name: 'old' })),
}));

jest.mock('../../../containers/onboardingChecklist/provider/GetStartedChecklistProvider');
const mockedReturn = useGetStartedChecklist as jest.MockedFunction<typeof useGetStartedChecklist>;

describe('MailboxContainerPlaceholder', () => {
    it('Should display checklist when no mails are present', async () => {
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
        } as OnboardingChecklistContext);

        await mailTestRender(
            <MailboxContainerPlaceholder
                showPlaceholder={true}
                welcomeFlag={false}
                labelID="labelID"
                checkedIDs={[]}
                handleCheckAll={jest.fn()}
            />
        );
        screen.getByTestId('onboarding-accounts-switcher');
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
                labelID="labelID"
                checkedIDs={[]}
                handleCheckAll={jest.fn()}
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
                labelID="labelID"
                checkedIDs={[]}
                handleCheckAll={jest.fn()}
            />
        );
        screen.getByTestId('section-pane--wrapper');
    });
});
