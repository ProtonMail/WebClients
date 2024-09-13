import type { FC, PropsWithChildren } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import PassLogo from '@proton/components/components/logo/PassLogo';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PASS_BLOG_TRIAL_URL } from '@proton/pass/constants';

import './PublicLayout.scss';

export const PublicLayout: FC<PropsWithChildren> = ({ children }) => {
    const { onLink } = usePassCore();

    return (
        <>
            <nav className="flex justify-space-between w-full absolute top-0 left-0 p-4 bg-norm">
                <PassLogo />
                <Button type="button" color="norm" className="rounded-full" onClick={() => onLink(PASS_BLOG_TRIAL_URL)}>
                    {c('Action').t`Try for free`}
                </Button>
            </nav>
            <main className="pass-public-layout h-full w-full overflow-auto relative p-8">
                <section
                    className="flex flex-nowrap flex-column w-full max-w-custom mx-auto text-center gap-2 mt-16"
                    style={{ '--max-w-custom': '30rem' }}
                >
                    {children}
                </section>
            </main>
        </>
    );
};
