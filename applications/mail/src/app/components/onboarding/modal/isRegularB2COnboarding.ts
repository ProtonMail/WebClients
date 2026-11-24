import type { Organization } from '@proton/shared/lib/interfaces/Organization';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/payments/plan/helpers';

/** The four cards a regular B2C user sees, in no particular order */
export const REGULAR_B2C_ONBOARDING_STEPS = [
    'onboarding-welcome',
    'get-desktop-app',
    'get-mobile-app',
    'new-onboarding-themes',
];

/**
 * Whether the user goes through the regular B2C onboarding: exactly the four regular cards, for a first-time user
 * who is neither in a B2B plan nor in a multi-user organization.
 * The themes card is a generic step, it is only shown when `hasGenericWelcomeStep` is true: a user already welcomed
 * in another Proton app sees three cards and is not regular.
 * Users in the view layout experiment see the `choose-view-layout` card, a fifth one, so they are not regular and
 * the two experiments never overlap.
 * Partner sign-ups, paid Mail plans and mobile or Electron users see other cards, so they are not regular.
 */
export const isRegularB2COnboarding = ({
    stepsToDisplay,
    isReplay,
    hasGenericWelcomeStep,
    organization,
}: {
    stepsToDisplay: ReadonlySet<string>;
    isReplay: boolean;
    hasGenericWelcomeStep: boolean;
    organization?: Pick<Organization, 'PlanName' | 'MaxMembers'>;
}) =>
    !isReplay &&
    hasGenericWelcomeStep &&
    !getIsB2BAudienceFromPlan(organization?.PlanName) &&
    (organization?.MaxMembers || 0) <= 1 &&
    stepsToDisplay.size === REGULAR_B2C_ONBOARDING_STEPS.length &&
    REGULAR_B2C_ONBOARDING_STEPS.every((id) => stepsToDisplay.has(id));
