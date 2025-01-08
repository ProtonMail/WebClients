import { Fragment, type ReactNode } from 'react';

import { c } from 'ttag';

import { LoaderPage } from '@proton/components';

import SharedPageLayout from './Layout/SharedPageLayout';

interface LoadingPageProps {
    haveCustomPassword: boolean;
    isPartialView?: boolean;
}

export default function LoadingPage({ haveCustomPassword, isPartialView = false }: LoadingPageProps) {
    // Only show the layout if the user had to submit a custom password
    const Wrapper = ({ children }: { children: ReactNode }) =>
        haveCustomPassword ? (
            <SharedPageLayout isPartialView={isPartialView} children={children} />
        ) : (
            <Fragment children={children} />
        );
    return (
        <Wrapper>
            <div className="flex flex-column items-center justify-center w-full h-full">
                <LoaderPage text={c('Info').t`Decrypting files`} />
            </div>
        </Wrapper>
    );
}
