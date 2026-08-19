import { renderHook } from '@testing-library/react';

import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import type { FeatureContextValue } from '@proton/features/useFeatures';
import {
    CategoriesOnboardingFlags,
    FeatureValueDefault,
} from '@proton/mail/features/categoriesView/categoriesOnboarding';
import { PLANS } from '@proton/payments/core/constants';
import type { OrganizationSettings } from '@proton/shared/lib/interfaces';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';
import { mockUseMailSettings } from '@proton/testing/lib/mockUseMailSettings';
import { mockUseOrganization } from '@proton/testing/lib/mockUseOrganization';
import { mockUseUser } from '@proton/testing/lib/mockUseUser';

import { useGetStartedChecklist } from '../../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { useMailboxCounter } from '../../../hooks/mailboxCounter/useMailboxCounter';
import { useMailSelector } from '../../../store/hooks';

import { useCategoriesView } from '../useCategoriesView';
import { OnboardingFlow } from './onboardingInterface';
import { useCategoriesOnboardingEligibility } from './useCategoriesOnboardingEligibility';

jest.mock('../../../containers/onboardingChecklist/provider/GetStartedChecklistProvider');
jest.mock('../../../hooks/mailboxCounter/useMailboxCounter');
jest.mock('@proton/account/welcomeFlags');
jest.mock('@proton/features/useFeature');
jest.mock('../../../store/hooks');
jest.mock('../useCategoriesView');

const ONBOARDING_ACCOUNT_THRESHOLD = 1738371600; // 2025-02-01
const EXISTING_ACCOUNT_CREATE_TIME = 1735693200; // 2025-01-01, before the threshold
const NEW_ACCOUNT_CREATE_TIME = 1740790800; // 2025-03-01, after the threshold

// A B2B user is considered done once they have dismissed the initial modal.
const B2B_ONBOARDING_SEEN = CategoriesOnboardingFlags.INITIAL_MODAL;

// A B2C user is considered done once every step of the linear sequence has been seen.
const B2C_ONBOARDING_SEEN =
    CategoriesOnboardingFlags.INITIAL_MODAL |
    CategoriesOnboardingFlags.SPOTLIGHT_MESSAGE |
    CategoriesOnboardingFlags.SPOTLIGHT_CATEGORIZE |
    CategoriesOnboardingFlags.SPOTLIGHT_CUSTOMIZE;

// Every step seen except the initial modal, so the user still has onboarding left to go through.
const B2C_ONBOARDING_IN_PROGRESS = B2C_ONBOARDING_SEEN & ~CategoriesOnboardingFlags.INITIAL_MODAL;

const defaultCategoriesView: ReturnType<typeof useCategoriesView> = {
    isCategoryViewEnabled: true,
    isCategoryViewEnabledSettled: true,
    canUseCategoryView: true,
    shouldShowTabs: true,
    categoriesStore: [],
    activeCategoriesTabs: [],
    shouldSeeWideToolbars: true,
};

const defaultWelcomeFlags: ReturnType<typeof useWelcomeFlags> = {
    endReplay: jest.fn(),
    setDone: jest.fn(),
    startReplay: jest.fn(),
    welcomeFlags: { isWelcomeFlow: false, hasGenericWelcomeStep: false, isDone: false, isReplay: false },
};

const defaultGetStartedChecklist: ReturnType<typeof useGetStartedChecklist> = {
    canDisplayChecklist: false,
    changeChecklistDisplay: jest.fn(),
    createdAt: new Date(),
    displayState: CHECKLIST_DISPLAY_TYPE.REDUCED,
    expiresAt: undefined,
    isChecklistFinished: false,
    isUserPaid: false,
    items: new Set([]),
    loading: false,
    markItemsAsDone: jest.fn(),
    userWasRewarded: false,
    itemsToComplete: [],
    byoeFlowInProgress: false,
    setByoeFlowInProgress: jest.fn(),
};

const buildFeature = (code: FeatureCode, value: number): FeatureContextValue => ({
    feature: {
        Code: code,
        Type: 'integer',
        DefaultValue: 0,
        Value: value,
        Minimum: 0,
        Maximum: 0,
        Global: false,
        Writable: true,
        ExpirationTime: 0,
        UpdateTime: 0,
    },
    loading: false,
    get: jest.fn(),
    update: jest.fn(),
    code,
});

interface FeatureOverrides {
    b2cOnboardingFlag?: number;
    b2bOnboardingFlag?: number;
    accountThreshold?: number;
}

const mockFeatures = ({
    b2cOnboardingFlag = FeatureValueDefault,
    b2bOnboardingFlag = FeatureValueDefault,
    accountThreshold = ONBOARDING_ACCOUNT_THRESHOLD,
}: FeatureOverrides = {}) => {
    const valueByCode: Partial<Record<FeatureCode, number>> = {
        [FeatureCode.CategoryViewB2COnboardingViewFlags]: b2cOnboardingFlag,
        [FeatureCode.CategoryViewB2BOnboardingViewFlags]: b2bOnboardingFlag,
        [FeatureCode.CategoryViewOnboardingAccountDateThreshold]: accountThreshold,
    };

    jest.mocked(useFeature).mockImplementation((code) => buildFeature(code, valueByCode[code] ?? 0));
};

const mockAccountCreatedAt = (createTime: number) => mockUseUser([{ CreateTime: createTime }]);

const mockMailCategoryView = (mailCategoryView: boolean) =>
    mockUseMailSettings([{ MailCategoryView: mailCategoryView }]);

const mockAllMailCount = (total: number) => {
    jest.mocked(useMailboxCounter).mockReturnValue({
        loading: false,
        getLocationCount: jest.fn().mockReturnValue({ Total: total, Unread: 0 }),
        getCurrentLocationCount: jest.fn(),
    });
};

const mockCategoriesView = (overrides: Partial<ReturnType<typeof useCategoriesView>> = {}) => {
    jest.mocked(useCategoriesView).mockReturnValue({ ...defaultCategoriesView, ...overrides });
};

const mockChecklistDisplay = (displayState: CHECKLIST_DISPLAY_TYPE) => {
    jest.mocked(useGetStartedChecklist).mockReturnValue({ ...defaultGetStartedChecklist, displayState });
};

const renderEligibility = () => renderHook(() => useCategoriesOnboardingEligibility()).result.current;

describe('useCategoriesOnboardingEligibility', () => {
    beforeAll(() => {
        jest.mocked(useWelcomeFlags).mockReturnValue(defaultWelcomeFlags);
        jest.mocked(useMailSelector).mockReturnValue(false);
    });

    // Reset every per-test mock to its default so a test cannot leak state into the next one.
    beforeEach(() => {
        mockFeatures();
        mockCategoriesView();
        mockChecklistDisplay(CHECKLIST_DISPLAY_TYPE.REDUCED);
        mockMailCategoryView(false);
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    describe('b2b users', () => {
        beforeAll(() => {
            mockUseOrganization([
                { PlanName: PLANS.MAIL_PRO, Settings: { MailCategoryViewEnabled: true } as OrganizationSettings },
            ]);
        });

        describe('existing users', () => {
            it('are eligible when they have not seen the onboarding yet', () => {
                mockAccountCreatedAt(EXISTING_ACCOUNT_CREATE_TIME);
                mockAllMailCount(10);

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: true,
                    onboardingFlow: OnboardingFlow.B2B,
                    flagValue: FeatureValueDefault,
                });
            });

            it('are not eligible when the organization enabled categories but they lack flag access', () => {
                mockAccountCreatedAt(EXISTING_ACCOUNT_CREATE_TIME);
                mockAllMailCount(10);
                mockCategoriesView({ isCategoryViewEnabled: false, canUseCategoryView: false });

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.B2B,
                    flagValue: FeatureValueDefault,
                });
            });

            it('are not eligible when they have already seen the onboarding', () => {
                mockAccountCreatedAt(EXISTING_ACCOUNT_CREATE_TIME);
                mockAllMailCount(10);
                mockFeatures({ b2bOnboardingFlag: B2B_ONBOARDING_SEEN });

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.B2B,
                    flagValue: B2B_ONBOARDING_SEEN,
                });
            });

            it('are not eligible when the category view is already enabled in their mail settings', () => {
                mockAccountCreatedAt(EXISTING_ACCOUNT_CREATE_TIME);
                mockAllMailCount(10);
                mockMailCategoryView(true);

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.B2B,
                    flagValue: FeatureValueDefault,
                });
            });
        });

        describe('new users', () => {
            it('are eligible with 20+ mails and an unseen onboarding', () => {
                mockAccountCreatedAt(NEW_ACCOUNT_CREATE_TIME);
                mockAllMailCount(20);

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: true,
                    onboardingFlow: OnboardingFlow.B2B,
                    flagValue: FeatureValueDefault,
                });
            });

            it('are not eligible with 20+ mails once the onboarding has been seen', () => {
                mockAccountCreatedAt(NEW_ACCOUNT_CREATE_TIME);
                mockAllMailCount(20);
                mockFeatures({ b2bOnboardingFlag: B2B_ONBOARDING_SEEN });

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.B2B,
                    flagValue: B2B_ONBOARDING_SEEN,
                });
            });

            it('are not eligible with fewer than 20 mails', () => {
                mockAccountCreatedAt(NEW_ACCOUNT_CREATE_TIME);
                mockAllMailCount(10);

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.B2B,
                    flagValue: FeatureValueDefault,
                });
            });

            it('are not eligible when the category view is already enabled in their mail settings', () => {
                mockAccountCreatedAt(NEW_ACCOUNT_CREATE_TIME);
                mockAllMailCount(20);
                mockMailCategoryView(true);

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.B2B,
                    flagValue: FeatureValueDefault,
                });
            });
        });
    });

    describe('b2c users', () => {
        beforeAll(() => {
            mockUseOrganization();
        });

        describe('existing users', () => {
            it('are eligible with a closed checklist and enough mails', () => {
                mockAccountCreatedAt(EXISTING_ACCOUNT_CREATE_TIME);
                mockAllMailCount(10);

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: true,
                    onboardingFlow: OnboardingFlow.B2C,
                    flagValue: FeatureValueDefault,
                });
            });

            it('are not eligible while the checklist is still shown in full', () => {
                mockAccountCreatedAt(EXISTING_ACCOUNT_CREATE_TIME);
                mockAllMailCount(10);
                mockChecklistDisplay(CHECKLIST_DISPLAY_TYPE.FULL);

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.B2C,
                    flagValue: FeatureValueDefault,
                });
            });

            it('are not eligible without enough mails', () => {
                mockAccountCreatedAt(EXISTING_ACCOUNT_CREATE_TIME);
                mockAllMailCount(5);

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.B2C,
                    flagValue: FeatureValueDefault,
                });
            });

            it('are not eligible once the whole onboarding has been seen', () => {
                mockAccountCreatedAt(EXISTING_ACCOUNT_CREATE_TIME);
                mockAllMailCount(10);
                mockFeatures({ b2cOnboardingFlag: B2C_ONBOARDING_SEEN });

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.B2C,
                    flagValue: B2C_ONBOARDING_SEEN,
                });
            });

            it('are eligible when the onboarding is still in progress', () => {
                mockAccountCreatedAt(EXISTING_ACCOUNT_CREATE_TIME);
                mockAllMailCount(10);
                mockFeatures({ b2cOnboardingFlag: B2C_ONBOARDING_IN_PROGRESS });

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: true,
                    onboardingFlow: OnboardingFlow.B2C,
                    flagValue: B2C_ONBOARDING_IN_PROGRESS,
                });
            });

            it('are not eligible without flag access, even mid-onboarding', () => {
                mockAccountCreatedAt(EXISTING_ACCOUNT_CREATE_TIME);
                mockAllMailCount(10);
                mockCategoriesView({ isCategoryViewEnabled: false });
                mockFeatures({ b2cOnboardingFlag: B2C_ONBOARDING_IN_PROGRESS });

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.B2C,
                    flagValue: B2C_ONBOARDING_IN_PROGRESS,
                });
            });
        });

        describe('new users', () => {
            it('are eligible to free prompt if enough emails received and is free', () => {
                mockUseUser([{ CreateTime: NEW_ACCOUNT_CREATE_TIME, hasPaidMail: false }]);
                jest.mocked(useMailSelector).mockReturnValue(true);
                mockAllMailCount(100);

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: true,
                    onboardingFlow: OnboardingFlow.FREE_PROMPT,
                    flagValue: FeatureValueDefault,
                });
            });

            it('are not eligible to free prompt if enough emails received and is not free', () => {
                mockUseUser([{ CreateTime: NEW_ACCOUNT_CREATE_TIME, hasPaidMail: true }]);
                jest.mocked(useMailSelector).mockReturnValue(true);
                mockAllMailCount(100);

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.FREE_PROMPT,
                    flagValue: FeatureValueDefault,
                });
            });

            it('are not eligible to free prompt if not enough emails received', () => {
                mockUseUser([{ CreateTime: NEW_ACCOUNT_CREATE_TIME, hasPaidMail: false }]);
                jest.mocked(useMailSelector).mockReturnValue(true);
                mockAllMailCount(40);

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.FREE_PROMPT,
                    flagValue: FeatureValueDefault,
                });
            });

            it('are not eligible to free prompt if already seen the spotlight', () => {
                mockUseUser([{ CreateTime: NEW_ACCOUNT_CREATE_TIME, hasPaidMail: false }]);
                jest.mocked(useMailSelector).mockReturnValue(true);
                mockAllMailCount(100);
                mockFeatures({ b2cOnboardingFlag: CategoriesOnboardingFlags.SPOTLIGHT_FREE_USERS });

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.FREE_PROMPT,
                    flagValue: CategoriesOnboardingFlags.SPOTLIGHT_FREE_USERS,
                });
            });

            it('are not eligible if no category view access', () => {
                mockUseUser([{ CreateTime: NEW_ACCOUNT_CREATE_TIME, hasPaidMail: false }]);
                jest.mocked(useMailSelector).mockReturnValue(true);
                mockAllMailCount(100);
                mockCategoriesView({ isCategoryViewEnabled: false });

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.FREE_PROMPT,
                    flagValue: FeatureValueDefault,
                });
            });

            it('are not eligible to free prompt if not default category configuration', () => {
                mockUseUser([{ CreateTime: NEW_ACCOUNT_CREATE_TIME, hasPaidMail: false }]);
                jest.mocked(useMailSelector).mockReturnValue(false);
                mockAllMailCount(100);

                expect(renderEligibility()).toStrictEqual({
                    isUserEligible: false,
                    onboardingFlow: OnboardingFlow.FREE_PROMPT,
                    flagValue: FeatureValueDefault,
                });
            });
        });
    });
});
