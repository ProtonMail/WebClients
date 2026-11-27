import { c } from 'ttag';

import type { JoinReason, PreviousProvider } from '../../../api/onboardingSurvey';

export interface PostSignupChoice {
    title: string;
    placeholder?: string;
}

export const getJoinReasonChoices = (): Record<JoinReason, PostSignupChoice> => ({
    leave_big_tech: { title: c('Onboarding modal').t`I don't want to use Big Tech anymore` },
    private_secure: { title: c('Onboarding modal').t`I want my emails private and secure` },
    no_ads_or_spam: { title: c('Onboarding modal').t`I want an inbox without ads or spam` },
    other_proton_products: { title: c('Onboarding modal').t`I use other Proton apps, or want them all in one place` },
    new_address: { title: c('Onboarding modal').t`I need a new email address` },
    other: {
        title: c('Onboarding modal').t`Others (tell us)`,
        placeholder: c('Onboarding modal').t`Tell us in a few words`,
    },
});

export const getPreviousEmailChoices = (): Record<PreviousProvider, PostSignupChoice> => ({
    // Brand names, not translated
    gmail: { title: 'Gmail' },
    outlook: { title: c('Onboarding modal').t`Outlook or Hotmail` },
    icloud: { title: 'iCloud' },
    yahoo: { title: 'Yahoo' },
    other_private_service: { title: c('Onboarding modal').t`Another private email service (e.g. Tuta)` },
    none: { title: c('Onboarding modal').t`None, this is my first email` },
    other: {
        title: c('Onboarding modal').t`Others (tell us)`,
        placeholder: c('Onboarding modal').t`Tell us in a few words`,
    },
});
