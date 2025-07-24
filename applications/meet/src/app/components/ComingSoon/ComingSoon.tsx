import { c } from 'ttag';

import logo from '../../../assets/meet-main-logo.png';

import './ComingSoon.scss';

export const ComingSoon = () => {
    return (
        <div className="flex h-full w-full flex-column items-center justify-center gap-6">
            <div
                className="coming-soon-logo-wrapper w-custom h-custom meet-radius flex items-center justify-center"
                style={{ '--w-custom': '5rem', '--h-custom': '5rem' }}
            >
                <img src={logo} alt="" />
            </div>
            <h2 className="h2 font-semibold">{c('l10n_nightly Title').t`Talk confidentially`}</h2>
            <div className="coming-soon-subtitle text-lg font-semibold">{c('l10n_nightly Info').t`Coming soon`}</div>
        </div>
    );
};
