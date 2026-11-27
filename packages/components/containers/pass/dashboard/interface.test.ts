import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';

import { PASS_ORG_SETUP_STEP_ID, getPassOrgSetupProgress, getPassOrgSetupStepIds } from './interface';

describe('getPassOrgSetupStepIds', () => {
    const baseStepIds = [
        PASS_ORG_SETUP_STEP_ID.CREATE_ACCOUNT,
        PASS_ORG_SETUP_STEP_ID.INVITE_TEAM,
        PASS_ORG_SETUP_STEP_ID.MANAGE_PASSWORDS,
    ];
    const allStepIds = [
        PASS_ORG_SETUP_STEP_ID.CREATE_ACCOUNT,
        PASS_ORG_SETUP_STEP_ID.INVITE_TEAM,
        PASS_ORG_SETUP_STEP_ID.REVIEW_POLICIES,
        PASS_ORG_SETUP_STEP_ID.TURN_ON_SSO,
        PASS_ORG_SETUP_STEP_ID.MANAGE_PASSWORDS,
    ];

    it.each([
        { name: 'Pass Professional', plans: [PLANS.PASS_BUSINESS], expected: allStepIds },
        { name: 'VPN and Pass Professional', plans: [PLANS.VPN_PASS_BUNDLE_BUSINESS], expected: allStepIds },
        { name: 'Pass Essentials', plans: [PLANS.PASS_PRO], expected: baseStepIds },
    ] satisfies { name: string; plans: CataloguedPlan[]; expected: string[] }[])(
        'returns the steps for $name',
        ({ plans, expected }) => {
            expect(getPassOrgSetupStepIds(buildOrgAndUserEntitlementChecks({ subscriptionPlans: plans }))).toEqual(
                expected
            );
        }
    );

    it('adds each step only with its entitlement', () => {
        expect(getPassOrgSetupStepIds({ hasOrganizationPolicy: true, hasSso: false })).toEqual([
            PASS_ORG_SETUP_STEP_ID.CREATE_ACCOUNT,
            PASS_ORG_SETUP_STEP_ID.INVITE_TEAM,
            PASS_ORG_SETUP_STEP_ID.REVIEW_POLICIES,
            PASS_ORG_SETUP_STEP_ID.MANAGE_PASSWORDS,
        ]);
        expect(getPassOrgSetupStepIds({ hasOrganizationPolicy: false, hasSso: true })).toEqual([
            PASS_ORG_SETUP_STEP_ID.CREATE_ACCOUNT,
            PASS_ORG_SETUP_STEP_ID.INVITE_TEAM,
            PASS_ORG_SETUP_STEP_ID.TURN_ON_SSO,
            PASS_ORG_SETUP_STEP_ID.MANAGE_PASSWORDS,
        ]);
    });
});

describe('getPassOrgSetupProgress', () => {
    const stepIds = [
        PASS_ORG_SETUP_STEP_ID.CREATE_ACCOUNT,
        PASS_ORG_SETUP_STEP_ID.INVITE_TEAM,
        PASS_ORG_SETUP_STEP_ID.MANAGE_PASSWORDS,
    ];

    it('counts creating the account as done before anything is saved', () => {
        expect(getPassOrgSetupProgress(stepIds, [])).toMatchObject({
            completed: 1,
            total: 3,
            percent: 33,
            firstIncompleteStepId: PASS_ORG_SETUP_STEP_ID.INVITE_TEAM,
        });
    });

    it('points to the first incomplete step when a later one is done', () => {
        expect(getPassOrgSetupProgress(stepIds, [PASS_ORG_SETUP_STEP_ID.MANAGE_PASSWORDS])).toMatchObject({
            completed: 2,
            percent: 67,
            firstIncompleteStepId: PASS_ORG_SETUP_STEP_ID.INVITE_TEAM,
        });
    });

    it('has no incomplete step once every step is done', () => {
        expect(
            getPassOrgSetupProgress(stepIds, [
                PASS_ORG_SETUP_STEP_ID.INVITE_TEAM,
                PASS_ORG_SETUP_STEP_ID.MANAGE_PASSWORDS,
            ])
        ).toMatchObject({ completed: 3, total: 3, percent: 100, firstIncompleteStepId: undefined });
    });

    it('ignores saved steps the plan does not show', () => {
        expect(getPassOrgSetupProgress(stepIds, [PASS_ORG_SETUP_STEP_ID.TURN_ON_SSO])).toMatchObject({
            completed: 1,
            total: 3,
        });
    });
});
