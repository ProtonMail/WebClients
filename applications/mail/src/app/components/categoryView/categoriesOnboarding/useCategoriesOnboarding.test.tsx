import { renderHook } from '@testing-library/react';

import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { useConversationCounts, useMessageCounts } from '@proton/mail/index';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';
import { mockUseOrganization } from '@proton/testing/index';
import { mockUseMailSettings } from '@proton/testing/lib/mockUseMailSettings';
import { mockUseUser } from '@proton/testing/lib/mockUseUser';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import { AudienceType } from './onboardingInterface';
import { useCategoriesOnboarding } from './useCategoriesOnboarding';

jest.mock('@proton/mail');
const mockUseMessageCounts = useMessageCounts as jest.Mock;
const mockUseConversationCounts = useConversationCounts as jest.Mock;

jest.mock('@proton/features/useFeature');
const mockUseFeature = useFeature as jest.Mock;

jest.mock('proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider');
const mockUseGetStartedChecklist = useGetStartedChecklist as jest.Mock;

jest.mock('@proton/account/welcomeFlags');
const mockUseWelcomeFlags = useWelcomeFlags as jest.Mock;

const janFirst = 1735693200;
// const janFirstMS = 1735693200000;
// const febFirst = 1738371600;
const febFirstMS = 1738371600000;
const marchFirst = 1740790800;
// const marchFirstMS = 1740790800000;

const getFeatureValues = (
    code: FeatureCode,
    {
        b2cOnboardingFlag,
        b2bOnboardingFlag,
        accountDateThreshold,
    }: { b2cOnboardingFlag: number; b2bOnboardingFlag: boolean; accountDateThreshold: number }
) => {
    if (code === FeatureCode.CategoryViewB2COnboardingViewFlags) {
        return { feature: { Value: b2cOnboardingFlag }, loading: false };
    }
    if (code === FeatureCode.CategoryViewB2BOnboardingView) {
        return { feature: { Value: b2bOnboardingFlag }, loading: false };
    }

    if (code === FeatureCode.CategoryViewOnboardingAccountDateThreshold) {
        return { feature: { Value: accountDateThreshold }, loading: false };
    }
};

describe('useCategoriesOnboarding', () => {
    describe('b2b users', () => {
        describe('existing users', () => {});
        describe('new users', () => {});
    });

    describe('b2c users', () => {
        beforeAll(() => {
            mockUseUser();
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
                        b2bOnboardingFlag: false,
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
                        b2bOnboardingFlag: false,
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
                        b2bOnboardingFlag: false,
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
                        b2bOnboardingFlag: false,
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
                        b2bOnboardingFlag: false,
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
                        b2bOnboardingFlag: false,
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
