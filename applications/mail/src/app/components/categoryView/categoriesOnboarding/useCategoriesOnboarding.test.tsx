import { renderHook } from '@testing-library/react';

import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { PLANS } from '@proton/payments';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';
import { mockUseOrganization } from '@proton/testing/index';
import { mockUseMailSettings } from '@proton/testing/lib/mockUseMailSettings';
import { mockUseUser } from '@proton/testing/lib/mockUseUser';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import { AudienceType } from './onboardingInterface';
import { useCategoriesOnboarding } from './useCategoriesOnboarding';

jest.mock('@proton/mail/store/labels/hooks', () => ({
    useLabels: jest.fn(),
    useFolders: jest.fn(),
    useSystemFolders: jest.fn(),
}));

jest.mock('@proton/mail/store/counts/conversationCountsSlice');
const mockUseConversationCounts = useConversationCounts as jest.Mock;

jest.mock('@proton/mail/store/counts/messageCountsSlice');
const mockUseMessageCounts = useMessageCounts as jest.Mock;

jest.mock('@proton/features/useFeature');
const mockUseFeature = useFeature as jest.Mock;

jest.mock('proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider');
const mockUseGetStartedChecklist = useGetStartedChecklist as jest.Mock;

jest.mock('@proton/account/welcomeFlags');
const mockUseWelcomeFlags = useWelcomeFlags as jest.Mock;

const janFirst = 1735693200;
const febFirstMS = 1738371600000;
const marchFirst = 1740790800;

const getFeatureValues = (
    code: FeatureCode,
    {
        b2cOnboardingFlag,
        b2bOnboardingFlag,
        accountDateThreshold,
    }: { b2cOnboardingFlag: number; b2bOnboardingFlag: number; accountDateThreshold: number }
) => {
    if (code === FeatureCode.CategoryViewB2COnboardingViewFlags) {
        return { feature: { Value: b2cOnboardingFlag }, loading: false };
    }

    if (code === FeatureCode.CategoryViewB2BOnboardingViewFlags) {
        return { feature: { Value: b2bOnboardingFlag }, loading: false };
    }

    if (code === FeatureCode.CategoryViewOnboardingAccountDateThreshold) {
        return { feature: { Value: accountDateThreshold }, loading: false };
    }
};

describe('useCategoriesOnboarding', () => {
    beforeAll(() => {
        mockUseOrganization([{ PlanName: PLANS.MAIL_PRO }]);
        mockUseMailSettings();
        mockUseWelcomeFlags.mockReturnValue({ welcomeFlags: { isWelcomeFlow: false } });
    });

    describe('b2b users', () => {
        describe('existing users', () => {
            it("users who didn't saw the onboarding are eligible", () => {
                mockUseUser([{ CreateTime: janFirst }]);
                mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }], false]);
                mockUseConversationCounts.mockReturnValue([
                    [{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }],
                    false,
                ]);
                mockUseGetStartedChecklist.mockReturnValue({ displayState: CHECKLIST_DISPLAY_TYPE.REDUCED });
                mockUseFeature.mockImplementation((code) => {
                    return getFeatureValues(code, {
                        b2cOnboardingFlag: 0,
                        b2bOnboardingFlag: 0,
                        accountDateThreshold: febFirstMS,
                    });
                });

                const { result } = renderHook(() => useCategoriesOnboarding());
                expect(result.current).toStrictEqual({
                    isUserEligible: true,
                    audienceType: AudienceType.B2B,
                    flagValue: 0,
                });
            });

            it('users who saw the onboarding are not eligible', () => {
                mockUseUser([{ CreateTime: janFirst }]);
                mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }], false]);
                mockUseConversationCounts.mockReturnValue([
                    [{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }],
                    false,
                ]);
                mockUseGetStartedChecklist.mockReturnValue({ displayState: CHECKLIST_DISPLAY_TYPE.REDUCED });
                mockUseFeature.mockImplementation((code) => {
                    return getFeatureValues(code, {
                        b2cOnboardingFlag: 0,
                        b2bOnboardingFlag: parseInt('0110001', 2),
                        accountDateThreshold: febFirstMS,
                    });
                });

                const { result } = renderHook(() => useCategoriesOnboarding());
                expect(result.current).toStrictEqual({
                    isUserEligible: false,
                    audienceType: AudienceType.B2B,
                    flagValue: parseInt('0110001', 2),
                });
            });
        });
        describe('new users', () => {
            it("users with more than 20 mails and who didn't saw the onboarding are eligible", () => {
                mockUseUser([{ CreateTime: marchFirst }]);
                mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 20 }], false]);
                mockUseConversationCounts.mockReturnValue([
                    [{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 20 }],
                    false,
                ]);
                mockUseGetStartedChecklist.mockReturnValue({ displayState: CHECKLIST_DISPLAY_TYPE.REDUCED });
                mockUseFeature.mockImplementation((code) => {
                    return getFeatureValues(code, {
                        b2cOnboardingFlag: 0,
                        b2bOnboardingFlag: 0,
                        accountDateThreshold: febFirstMS,
                    });
                });

                const { result } = renderHook(() => useCategoriesOnboarding());
                expect(result.current).toStrictEqual({
                    isUserEligible: true,
                    audienceType: AudienceType.B2B,
                    flagValue: 0,
                });
            });

            it('users with more than 20 mails with seen onboarding are not eligible', () => {
                mockUseUser([{ CreateTime: marchFirst }]);
                mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 20 }], false]);
                mockUseConversationCounts.mockReturnValue([
                    [{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 20 }],
                    false,
                ]);
                mockUseGetStartedChecklist.mockReturnValue({ displayState: CHECKLIST_DISPLAY_TYPE.REDUCED });
                mockUseFeature.mockImplementation((code) => {
                    return getFeatureValues(code, {
                        b2cOnboardingFlag: 0,
                        b2bOnboardingFlag: parseInt('0110001', 2),
                        accountDateThreshold: febFirstMS,
                    });
                });

                const { result } = renderHook(() => useCategoriesOnboarding());
                expect(result.current).toStrictEqual({
                    isUserEligible: false,
                    audienceType: AudienceType.B2B,
                    flagValue: parseInt('0110001', 2),
                });
            });

            it('users with more let than 20 mails are not eligible', () => {
                mockUseUser([{ CreateTime: marchFirst }]);
                mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }], false]);
                mockUseConversationCounts.mockReturnValue([
                    [{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }],
                    false,
                ]);
                mockUseGetStartedChecklist.mockReturnValue({ displayState: CHECKLIST_DISPLAY_TYPE.REDUCED });
                mockUseFeature.mockImplementation((code) => {
                    return getFeatureValues(code, {
                        b2cOnboardingFlag: 0,
                        b2bOnboardingFlag: 0,
                        accountDateThreshold: febFirstMS,
                    });
                });

                const { result } = renderHook(() => useCategoriesOnboarding());
                expect(result.current).toStrictEqual({
                    isUserEligible: false,
                    audienceType: AudienceType.B2B,
                    flagValue: 0,
                });
            });
        });
    });

    describe('b2c users', () => {
        beforeAll(() => {
            mockUseOrganization();
            mockUseMailSettings();
            mockUseWelcomeFlags.mockReturnValue({ welcomeFlags: { isWelcomeFlow: false } });
        });

        describe('existing users', () => {
            it('users with closed checklist and 10 emails received should be eligible', () => {
                mockUseUser([{ CreateTime: janFirst }]);
                mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }], false]);
                mockUseConversationCounts.mockReturnValue([
                    [{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }],
                    false,
                ]);
                mockUseGetStartedChecklist.mockReturnValue({ displayState: CHECKLIST_DISPLAY_TYPE.REDUCED });
                mockUseFeature.mockImplementation((code) => {
                    return getFeatureValues(code, {
                        b2cOnboardingFlag: 0,
                        b2bOnboardingFlag: 0,
                        accountDateThreshold: febFirstMS,
                    });
                });

                const { result } = renderHook(() => useCategoriesOnboarding());
                expect(result.current).toStrictEqual({
                    isUserEligible: true,
                    audienceType: AudienceType.B2C,
                    flagValue: 0,
                });
            });

            it('users with full checklist should not be eligible', () => {
                mockUseUser([{ CreateTime: janFirst }]);
                mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }], false]);
                mockUseConversationCounts.mockReturnValue([
                    [{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }],
                    false,
                ]);
                mockUseGetStartedChecklist.mockReturnValue({ displayState: CHECKLIST_DISPLAY_TYPE.FULL });
                mockUseFeature.mockImplementation((code) => {
                    return getFeatureValues(code, {
                        b2cOnboardingFlag: 0,
                        b2bOnboardingFlag: 0,
                        accountDateThreshold: febFirstMS,
                    });
                });

                const { result } = renderHook(() => useCategoriesOnboarding());
                expect(result.current).toStrictEqual({
                    isUserEligible: false,
                    audienceType: AudienceType.B2C,
                    flagValue: 0,
                });
            });

            it('users with not enough emails should not be eligible', () => {
                mockUseUser([{ CreateTime: janFirst }]);
                mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 5 }], false]);
                mockUseConversationCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 5 }], false]);
                mockUseGetStartedChecklist.mockReturnValue({ displayState: CHECKLIST_DISPLAY_TYPE.REDUCED });
                mockUseFeature.mockImplementation((code) => {
                    return getFeatureValues(code, {
                        b2cOnboardingFlag: 0,
                        b2bOnboardingFlag: 0,
                        accountDateThreshold: febFirstMS,
                    });
                });

                const { result } = renderHook(() => useCategoriesOnboarding());
                expect(result.current).toStrictEqual({
                    isUserEligible: false,
                    audienceType: AudienceType.B2C,
                    flagValue: 0,
                });
            });

            it('users who saw whole onboarding should not be eligible', () => {
                mockUseUser([{ CreateTime: janFirst }]);
                mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }], false]);
                mockUseConversationCounts.mockReturnValue([
                    [{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }],
                    false,
                ]);
                mockUseGetStartedChecklist.mockReturnValue({ displayState: CHECKLIST_DISPLAY_TYPE.REDUCED });
                mockUseFeature.mockImplementation((code) => {
                    return getFeatureValues(code, {
                        b2cOnboardingFlag: parseInt('11111', 2),
                        b2bOnboardingFlag: 0,
                        accountDateThreshold: febFirstMS,
                    });
                });

                const { result } = renderHook(() => useCategoriesOnboarding());
                expect(result.current).toStrictEqual({
                    isUserEligible: false,
                    audienceType: AudienceType.B2C,
                    flagValue: parseInt('11111', 2),
                });
            });

            it("users who didn't see whole onboarding should  be eligible", () => {
                mockUseUser([{ CreateTime: janFirst }]);
                mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }], false]);
                mockUseConversationCounts.mockReturnValue([
                    [{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }],
                    false,
                ]);
                mockUseGetStartedChecklist.mockReturnValue({ displayState: CHECKLIST_DISPLAY_TYPE.REDUCED });
                mockUseFeature.mockImplementation((code) => {
                    return getFeatureValues(code, {
                        b2cOnboardingFlag: parseInt('11110', 2),
                        b2bOnboardingFlag: 0,
                        accountDateThreshold: febFirstMS,
                    });
                });

                const { result } = renderHook(() => useCategoriesOnboarding());
                expect(result.current).toStrictEqual({
                    isUserEligible: true,
                    audienceType: AudienceType.B2C,
                    flagValue: parseInt('11110', 2),
                });
            });
        });
        describe('new users', () => {
            it('users with closed checklist and 10 emails received should not', () => {
                mockUseUser([{ CreateTime: marchFirst }]);
                mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }], false]);
                mockUseConversationCounts.mockReturnValue([
                    [{ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Total: 10 }],
                    false,
                ]);
                mockUseGetStartedChecklist.mockReturnValue({ displayState: CHECKLIST_DISPLAY_TYPE.REDUCED });
                mockUseFeature.mockImplementation((code) => {
                    return getFeatureValues(code, {
                        b2cOnboardingFlag: 0,
                        b2bOnboardingFlag: 0,
                        accountDateThreshold: febFirstMS,
                    });
                });

                const { result } = renderHook(() => useCategoriesOnboarding());
                expect(result.current).toStrictEqual({
                    isUserEligible: false,
                    audienceType: AudienceType.B2C,
                    flagValue: 0,
                });
            });
        });
    });
});
