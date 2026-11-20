import { render, screen } from '@testing-library/react';
import { addDays } from 'date-fns';
import type { MockedFunction } from 'vitest';

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces/Checklist';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';

import type { OnboardingChecklistContext } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { useGetStartedChecklist } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { useMailSelector } from '../../store/hooks';
import { useChecklistTracking } from '../../telemetry/useChecklistTracking';
import EmptyListPlaceholder from './EmptyListPlaceholder';

vi.mock('../../containers/onboardingChecklist/provider/GetStartedChecklistProvider', () => ({
    __esModule: true,
    useGetStartedChecklist: vi.fn(),
    default: ({ children }: { children: any }) => <>{children}</>,
}));

vi.mock('../../containers/onboardingChecklist/provider/GetStartedChecklistProvider');
const mockedReturn = useGetStartedChecklist as MockedFunction<typeof useGetStartedChecklist>;

vi.mock('@proton/activation/src/components/SettingsArea/ProviderCards/ProviderCard', () => ({ default: () => null }));

vi.mock('@proton/byoe/src/hooks/useBYOEFeatureStatus', () => ({
    __esModule: true,
    default: () => [false, false] as const,
}));

vi.mock('@proton/activation/src/logic/store', () => ({
    useEasySwitchSelector: vi.fn(() => null),
}));

vi.mock('../../telemetry/useChecklistTracking');
vi.mocked(useChecklistTracking).mockReturnValue({
    trackStepLoaded: vi.fn(),
    trackStepInteracted: vi.fn(),
    trackProviderSelected: vi.fn(),
    trackServiceSelected: vi.fn(),
    trackChecklistReduced: vi.fn(),
    trackStepCompleted: vi.fn(),
    trackFlowFinished: vi.fn(),
    trackFlowDismissed: vi.fn(),
});

vi.mock('../../store/hooks');
vi.mocked(useMailSelector).mockReturnValue(undefined);

vi.mock('@proton/mail/store/mailSettings/hooks');
vi.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);

describe('EmptyListPlaceholder', () => {
    it('Should display checklist when no mails are present', async () => {
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
            itemsToComplete: ['Import'],
        } as OnboardingChecklistContext);

        render(<EmptyListPlaceholder labelID="labelID" isSearch={false} isUnread={false} />);
        screen.getByTestId('onboarding-importers');
    });

    it('Should display placeholder when checklist is not reduced', async () => {
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.REDUCED,
            items: new Set(),
        } as OnboardingChecklistContext);

        render(<EmptyListPlaceholder labelID="labelID" isSearch={false} isUnread={false} />);
        screen.getByTestId('empty-view-placeholder--empty-title');
    });

    it('Should display placeholder when checklist is not hidden', async () => {
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.HIDDEN,
            items: new Set(),
        } as OnboardingChecklistContext);

        render(<EmptyListPlaceholder labelID="labelID" isSearch={false} isUnread={false} />);
        screen.getByTestId('empty-view-placeholder--empty-title');
    });
});
