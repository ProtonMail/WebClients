import { screen } from '@testing-library/react';
import { addDays } from 'date-fns';

import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import type { ContextState } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { useGetStartedChecklist } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { render } from '../../helpers/test/helper';
import EmptyListPlaceholder from './EmptyListPlaceholder';

jest.mock('../../containers/onboardingChecklist/provider/GetStartedChecklistProvider', () => ({
    __esModule: true,
    useGetStartedChecklist: jest.fn(),
    default: ({ children }: { children: any }) => <>{children}</>,
}));

jest.mock('@proton/unleash/useVariant', () => jest.fn(() => ({ name: 'old' })));

jest.mock('../../containers/onboardingChecklist/provider/GetStartedChecklistProvider');
const mockedReturn = useGetStartedChecklist as jest.MockedFunction<typeof useGetStartedChecklist>;

describe('EmptyListPlaceholder', () => {
    it('Should display checklist when no mails are present', async () => {
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
        } as ContextState);

        await render(<EmptyListPlaceholder labelID="labelID" isSearch={false} isUnread={false} />);
        screen.getByTestId('onboarding-checklist');
    });

    it('Should display placeholder when checklist is not reduced', async () => {
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.REDUCED,
            items: new Set(),
        } as ContextState);

        await render(<EmptyListPlaceholder labelID="labelID" isSearch={false} isUnread={false} />);
        screen.getByTestId('empty-view-placeholder--empty-title');
    });

    it('Should display placeholder when checklist is not hidden', async () => {
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.HIDDEN,
            items: new Set(),
        } as ContextState);

        await render(<EmptyListPlaceholder labelID="labelID" isSearch={false} isUnread={false} />);
        screen.getByTestId('empty-view-placeholder--empty-title');
    });
});
