import { c } from 'ttag';

import { LoaderPage } from '@proton/components';

import SharedPageLayout from './Layout/SharedPageLayout';

export default function LoadingPage() {
    return (
        <SharedPageLayout>
            <div className="flex flex-column items-center justify-center w-full h-full">
                <LoaderPage text={c('Info').t`Decrypting files`} />
            </div>
        </SharedPageLayout>
    );
}
