import { render, screen } from '@testing-library/react';
import { createLocation } from 'history';

import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { getTestPlans } from '@proton/payments/testing/data-plans';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';

import { SignupMode } from '../interface';
import { getSignupParameters } from '../signupParameters';
import { getPassConfiguration } from './configuration';

const openPassPlusSignup = (url: string) => {
    const signupParameters = getSignupParameters({
        toApp: APPS.PROTONPASS,
        visionarySignupEnabled: false,
        location: createLocation(url),
    });
    const passPlus = getTestPlans('EUR').find(({ Name }) => Name === PLANS.PASS);

    const { benefits } = getPassConfiguration({
        showPassFamily: true,
        mode: SignupMode.Default,
        audience: Audience.B2C,
        hideFreePlan: false,
        isLargeViewport: true,
        isPaidPass: true,
        isPaidPassVPNBundle: false,
        plan: passPlus,
        signupParameters,
    });
    render(<>{benefits}</>);
};

describe('Pass Plus signup benefits', () => {
    it('mentions the other products included', () => {
        openPassPlusSignup('/pass/signup?plan=pass2023');

        expect(screen.getByText('Mail, calendar, file storage, and VPN included')).toBeInTheDocument();
        expect(screen.getByText('Protected by Swiss privacy laws')).toBeInTheDocument();
    });

    it('hides the other products when the link asks to', () => {
        openPassPlusSignup('/pass/signup?plan=pass2023&hideIncludedProducts=true');

        expect(screen.queryByText(/VPN/)).not.toBeInTheDocument();
        expect(screen.getByText('Protected by Swiss privacy laws')).toBeInTheDocument();
    });
});

const autoTrial = { preSelectedPlan: PLANS.PASS_BUSINESS, trial: true, cardless: true, isPassB2BAutoTrial: true };

const getConfiguration = ({
    audience = Audience.B2B,
    preSelectedPlan,
    isPassB2BAutoTrialFlagEnabled = true,
    showPassBasic,
}: {
    audience?: Audience.B2B | Audience.B2C;
    preSelectedPlan?: string;
    isPassB2BAutoTrialFlagEnabled?: boolean;
    showPassBasic?: boolean;
}) =>
    getPassConfiguration({
        showPassFamily: true,
        mode: SignupMode.Default,
        audience,
        hideFreePlan: false,
        isLargeViewport: true,
        isPaidPass: false,
        isPaidPassVPNBundle: false,
        plan: undefined,
        signupParameters: { preSelectedPlan, isPassB2BAutoTrialFlagEnabled, showPassBasic },
    });

describe('getPassConfiguration', () => {
    describe('Pass B2B auto-trial', () => {
        it.each([undefined, PLANS.PASS_BASIC])(
            'starts the cardless Pass Professional trial on the B2B audience (plan %p)',
            (preSelectedPlan) => {
                expect(getConfiguration({ preSelectedPlan }).signupParametersOverrides).toEqual(autoTrial);
            }
        );

        it.each([PLANS.PASS_PRO, PLANS.PASS_BUSINESS])(
            'backs off for another selected plan (%p)',
            (preSelectedPlan) => {
                expect(getConfiguration({ preSelectedPlan }).signupParametersOverrides).toBeUndefined();
            }
        );

        it('only applies to the B2B audience', () => {
            expect(getConfiguration({ audience: Audience.B2C }).signupParametersOverrides).toBeUndefined();
        });

        it.each([undefined, PLANS.PASS_BASIC])('does nothing while the flag is off (plan %p)', (preSelectedPlan) => {
            expect(
                getConfiguration({ preSelectedPlan, isPassB2BAutoTrialFlagEnabled: false }).signupParametersOverrides
            ).toBeUndefined();
        });

        it('starts the B2B audience tab on the trial while the flag is on', () => {
            const b2bTab = (isPassB2BAutoTrialFlagEnabled: boolean) =>
                getConfiguration({ audience: Audience.B2C, isPassB2BAutoTrialFlagEnabled }).audiences?.find(
                    ({ value }) => value === Audience.B2B
                );
            expect(b2bTab(true)).toMatchObject({ defaultPlan: PLANS.PASS_BUSINESS, trial: true });
            expect(b2bTab(false)).not.toHaveProperty('trial');
        });
    });

    it.each([undefined, PLANS.PASS_BASIC])(
        'defaults the B2B audience to Pass Professional (plan %p)',
        (preSelectedPlan) => {
            expect(getConfiguration({ preSelectedPlan, isPassB2BAutoTrialFlagEnabled: false }).defaults).toEqual({
                plan: PLANS.PASS_BUSINESS,
                cycle: CYCLE.YEARLY,
            });
        }
    );

    it('adds no extra seats to the Pass Basic card', () => {
        const passBasicCard = getConfiguration({ showPassBasic: true }).planCards[Audience.B2B].find(
            ({ plan }) => plan === PLANS.PASS_BASIC
        );
        expect(passBasicCard).toBeDefined();
        expect(passBasicCard).not.toHaveProperty('addons');
    });

    describe('Pass Basic card', () => {
        const getB2BPlans = (url: string, toApp: APP_NAMES = APPS.PROTONPASS) => {
            const { showPassBasic } = getSignupParameters({
                toApp,
                visionarySignupEnabled: false,
                location: createLocation(url),
            });
            return getConfiguration({ isPassB2BAutoTrialFlagEnabled: false, showPassBasic }).planCards[
                Audience.B2B
            ].map(({ plan }) => plan);
        };

        it('is hidden from the B2B plan selector by default', () => {
            expect(getB2BPlans('/pass/signup/business')).not.toContain(PLANS.PASS_BASIC);
            expect(getB2BPlans('/pass/signup/business?showPassBasic=false')).not.toContain(PLANS.PASS_BASIC);
        });

        it('is shown when the link asks for it', () => {
            expect(getB2BPlans('/pass/signup/business?showPassBasic=true')).toEqual([
                PLANS.PASS_BASIC,
                PLANS.PASS_PRO,
                PLANS.PASS_BUSINESS,
                undefined,
            ]);
        });

        it('ignores the parameter outside Pass signups', () => {
            expect(getB2BPlans('/mail/signup/business?showPassBasic=true', APPS.PROTONMAIL)).not.toContain(
                PLANS.PASS_BASIC
            );
        });
    });
});
