import { c } from 'ttag';

import desktopFailure from '../assets/desktopFailure.svg';
import mobileFailure from '../assets/mobileFailure.svg';
import type { FetchErrors } from '../types';

const mapErrorWithTexts: Record<FetchErrors, Record<'title' | 'hint', () => string>> = {
    'business-user': {
        title: () => c('Title').t`Couldn't sign in`,
        hint: () => c('Info').t`Click 'Trouble signing in?' on your TV to follow the alternative steps.`,
    },
    'code-expired': {
        title: () => c('Title').t`Code expired`,
        hint: () => c('Info').t`Create a new code on your TV and try again.`,
    },
    generic: {
        title: () => c('Title').t`Couldn't sign in`,
        hint: () => c('Info').t`Check your network and try again.`,
    },
};

export const TvSignInFailed = ({ error }: { error: FetchErrors }) => {
    const { hint, title } = mapErrorWithTexts[error];
    return (
        <div className="flex flex-column items-center mb-8 text-center">
            <picture>
                <source media="(min-width: 64em)" srcSet={desktopFailure} />
                <img src={mobileFailure} alt="Failure device for connection stablishment." role="presentation" />
            </picture>
            <h1>{title()}</h1>
            <span className="color-weak">{hint()}</span>
        </div>
    );
};
