import type { EntitlementChecksForOrgAndUser } from '@proton/payments/core/entitlements/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';
import unique from '@proton/utils/unique';

export const PASS_ORG_SETUP_STEP_ID = {
    CREATE_ACCOUNT: 'create-account',
    INVITE_TEAM: 'invite-team',
    REVIEW_POLICIES: 'review-policies',
    TURN_ON_SSO: 'turn-on-sso',
    MANAGE_PASSWORDS: 'manage-passwords',
} as const;

export type PassOrgSetupStepId = (typeof PASS_ORG_SETUP_STEP_ID)[keyof typeof PASS_ORG_SETUP_STEP_ID];

export interface PassOrgSetupStep {
    id: PassOrgSetupStepId;
    label: string;
}

export const getShowPassOrgSetupChecklist = ({
    app,
    isAdmin,
    entitlements,
}: {
    app: APP_NAMES;
    isAdmin: boolean;
    entitlements: Pick<EntitlementChecksForOrgAndUser, 'isPassB2BWithoutMail'>;
}) => app === APPS.PROTONPASS && isAdmin && entitlements.isPassB2BWithoutMail;

export const getPassOrgSetupStepIds = (
    entitlements: Pick<EntitlementChecksForOrgAndUser, 'hasOrganizationPolicy' | 'hasSso'>
): PassOrgSetupStepId[] =>
    [
        PASS_ORG_SETUP_STEP_ID.CREATE_ACCOUNT,
        PASS_ORG_SETUP_STEP_ID.INVITE_TEAM,
        entitlements.hasOrganizationPolicy && PASS_ORG_SETUP_STEP_ID.REVIEW_POLICIES,
        entitlements.hasSso && PASS_ORG_SETUP_STEP_ID.TURN_ON_SSO,
        PASS_ORG_SETUP_STEP_ID.MANAGE_PASSWORDS,
    ].filter(isTruthy);

const ALWAYS_COMPLETED_STEP_IDS: PassOrgSetupStepId[] = [PASS_ORG_SETUP_STEP_ID.CREATE_ACCOUNT];

export const getPassOrgSetupProgress = (stepIds: PassOrgSetupStepId[], savedStepIds: PassOrgSetupStepId[]) => {
    const completedStepIds = unique([...ALWAYS_COMPLETED_STEP_IDS, ...savedStepIds]);
    const total = stepIds.length;
    const completed = stepIds.filter((stepId) => completedStepIds.includes(stepId)).length;

    return {
        completedStepIds,
        completed,
        total,
        percent: total === 0 ? 0 : Math.round((completed / total) * 100),
        firstIncompleteStepId: stepIds.find((stepId) => !completedStepIds.includes(stepId)),
    };
};
