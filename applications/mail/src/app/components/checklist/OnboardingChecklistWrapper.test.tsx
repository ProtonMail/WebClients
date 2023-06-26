import { fireEvent } from '@testing-library/react';

import { useFeature } from '@proton/components/hooks';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import {
    ContextState,
    useGetStartedChecklist,
} from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { minimalCache, render } from 'proton-mail/helpers/test/helper';

import MailSidebar from '../sidebar/MailSidebar';
import OnboardingChecklistWrapper from './OnboardingChecklistWrapper';

// TODO delete when cleaning the old checklist
jest.mock('@proton/components/hooks/useFeature');
const mockFeature = useFeature as jest.MockedFunction<any>;

jest.mock('../../containers/onboardingChecklist/provider/GetStartedChecklistProvider', () => ({
    __esModule: true,
    useGetStartedChecklist: jest.fn(),
    default: ({ children }: { children: any }) => <>{children}</>,
}));

jest.mock('../../containers/onboardingChecklist/provider/GetStartedChecklistProvider');
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

        mockFeature.mockReturnValue({ feature: { Value: true } });
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
            changeChecklistDisplay: mockedChangeDisplay,
        } as Partial<ContextState>);

        const { getByText } = await render(<OnboardingChecklistWrapper />, false);
        const { container } = await render(<MailSidebar {...props} />, false);

        const nav = container.querySelector('nav');
        expect(nav?.childNodes.length).toEqual(2);

        const laterButton = getByText('Maybe later');
        fireEvent.click(laterButton);
        expect(mockedChangeDisplay).toHaveBeenCalledWith(CHECKLIST_DISPLAY_TYPE.REDUCED);
    });

    it('Should hide maybe later when dismiss button', async () => {
        mockFeature.mockReturnValue({ feature: { Value: true } });
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
        } as Partial<ContextState>);

        const { queryByText } = await render(<OnboardingChecklistWrapper hideDismissButton />, false);
        const laterButton = queryByText('Maybe later');
        expect(laterButton).toBeNull();
    });

    it('Should display the small text when smallVariant is enabled', async () => {
        mockFeature.mockReturnValue({ feature: { Value: true } });
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
        } as Partial<ContextState>);

        const { getByText } = await render(<OnboardingChecklistWrapper smallVariant />, false);
        getByText('Discover privacy features');
        getByText('Auto-forward Gmail');
        getByText('Update your logins');
        getByText('Get the App');
    });

    // TODO delete when cleaning the old checklist
    it('Should display the old modal if the feature is not enabled', async () => {
        mockFeature.mockReturnValue({ feature: { Value: false } });
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
        } as Partial<ContextState>);

        const { getByText } = await render(<OnboardingChecklistWrapper />, false);
        getByText('Get mobile app');
        getByText('Send a message');
        getByText('Set recovery method');
        getByText('Import contacts or emails');
    });
});
