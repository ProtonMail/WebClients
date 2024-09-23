import { fireEvent } from '@testing-library/react';
import { addDays } from 'date-fns';

import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import type { ContextState } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { minimalCache, render } from 'proton-mail/helpers/test/helper';

import MailSidebar from '../../sidebar/MailSidebar';
import UsersOnboardingChecklist from './UsersOnboardingChecklist';

jest.mock('proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider', () => ({
    __esModule: true,
    useGetStartedChecklist: jest.fn(),
    default: ({ children }: { children: any }) => <>{children}</>,
}));

const mockedReturn = useGetStartedChecklist as jest.MockedFunction<any>;

const labelID = 'labelID';

const props = {
    labelID,
    location: {} as Location,
    onToggleExpand: jest.fn(),
};

describe('OnboardingChecklistWrapper', () => {
    beforeEach(() => {
        minimalCache();
    });

    it('Should reduce the checklist when pressing the "Maybe later" button', async () => {
        const mockedChangeDisplay = jest.fn();

        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
            changeChecklistDisplay: mockedChangeDisplay,
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
        } as Partial<ContextState>);

        const { getByText } = await render(<UsersOnboardingChecklist />);
        const { container } = await render(<MailSidebar {...props} />);

        const nav = container.querySelector('nav');
        expect(nav?.childNodes.length).toEqual(3);

        const laterButton = getByText('Maybe later');
        fireEvent.click(laterButton);
        expect(mockedChangeDisplay).toHaveBeenCalledWith(CHECKLIST_DISPLAY_TYPE.REDUCED);
    });

    it('Should hide maybe later when dismiss button', async () => {
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
        } as Partial<ContextState>);

        const { queryByText } = await render(<UsersOnboardingChecklist hideDismissButton />);
        const laterButton = queryByText('Maybe later');
        expect(laterButton).toBeNull();
    });

    it('Should display the small text when smallVariant is enabled', async () => {
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
        } as Partial<ContextState>);

        const { getByText } = await render(<UsersOnboardingChecklist smallVariant />);
        getByText('Discover privacy features');
        getByText('Auto-forward Gmail');
        getByText('Update your logins');
        getByText('Get the App');
    });
});
