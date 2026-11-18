import { c } from 'ttag';

import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import warningIcon from '@proton/styles/assets/img/meet/warning-icon.svg';

export const WasmUnsupportedError = () => {
    return (
        <div className="unsupported-browser-container text-center gap-4 p-6" role="alert">
            <img
                className="w-custom h-custom"
                src={warningIcon}
                alt=""
                style={{ '--w-custom': '5rem', '--h-custom': '5rem' }}
            />
            <h1 className="m-0 text-3xl text-semibold">{c('Title').t`Browser not supported`}</h1>
            <p className="m-0 color-weak">
                {c('Info')
                    .t`${MEET_APP_NAME} needs WebAssembly, which is off or not available in this browser. Turn it on, or use another browser.`}
            </p>
        </div>
    );
};
