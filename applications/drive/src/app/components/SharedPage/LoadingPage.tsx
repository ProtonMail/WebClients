import { Fragment } from 'react';

import { c } from 'ttag';

import { LoaderPage } from '@proton/components';

import SharedPageLayout from './Layout/SharedPageLayout';

export default function LoadingPage({ haveCustomPassword }: { haveCustomPassword: boolean }) {
    // Only show the layout if the user had to submit a custom password
    const Wrapper = haveCustomPassword ? SharedPageLayout : Fragment;
    return (
        <Wrapper>
            <div className="flex flex-column items-center justify-center w-full h-full">
                <LoaderPage text={c('Info').t`Decrypting files`} />
            </div>
        </Wrapper>
    );
}
