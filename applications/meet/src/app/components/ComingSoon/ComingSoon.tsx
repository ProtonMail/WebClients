import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ForkType, requestFork } from '@proton/shared/lib/authentication/fork';
import { APPS } from '@proton/shared/lib/constants';
import logo from '@proton/styles/assets/img/meet/meet-main-logo.png';

import './ComingSoon.scss';

export const ComingSoon = () => {
    const handleSignIn = () =>
        requestFork({
            fromApp: APPS.PROTONMEET,
            forkType: ForkType.LOGIN,
        });

    return (
        <>
            <Button
                className="action-button rounded-full border-none absolute top-custom right-custom"
                style={{ '--top-custom': '1rem', '--right-custom': '1rem' }}
                onClick={handleSignIn}
            >
                {c('Action').t`Sign in`}
            </Button>
            <div className="flex h-full w-full flex-column items-center justify-center gap-6">
                <div
                    className="coming-soon-logo-wrapper w-custom h-custom meet-radius flex items-center justify-center"
                    style={{ '--w-custom': '5rem', '--h-custom': '5rem' }}
                >
                    <img src={logo} alt="" />
                </div>
                <h2 className="text-semibold">{c('Title').t`Talk confidentially`}</h2>
                <div className="coming-soon-subtitle text-lg text-semibold">{c('Info').t`Coming soon`}</div>
            </div>
        </>
    );
};
