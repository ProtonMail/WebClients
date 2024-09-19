import { c } from 'ttag';

import { LoaderPage } from '@proton/components';

export default function LoadingPage() {
    return (
        <div className="flex flex-column items-center justify-center w-full h-full">
            <LoaderPage text={c('Info').t`Decrypting files`} />
        </div>
    );
}
