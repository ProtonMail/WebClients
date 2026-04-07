import { c } from 'ttag';

import desktopFailure from '../assets/desktopFailure.svg';
import mobileFailure from '../assets/mobileFailure.svg';

export const TvSignInFailed = () => {
    return (
        <div className="flex flex-column items-center mb-8">
            <picture>
                <source media="(min-width: 64em)" srcSet={desktopFailure} />
                <img src={mobileFailure} alt="Failure device for connection stablishment." role="presentation" />
            </picture>
            <h1>{c('Info').t`Code expired`}</h1>
            <span className="color-weak">{c('Info').t`Create a new code on your TV and try again.`}</span>
        </div>
    );
};
