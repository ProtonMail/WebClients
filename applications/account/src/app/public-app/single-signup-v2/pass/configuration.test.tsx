import { render, screen } from '@testing-library/react';
import { createLocation } from 'history';

import { PLANS } from '@proton/payments/core/constants';
import { getTestPlans } from '@proton/payments/testing/data-plans';
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
