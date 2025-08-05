import { c } from 'ttag';

import { MEET_APP_NAME } from '@proton/shared/lib/constants';

export const WasmUnsupportedError = () => {
    return (
        <div className="unsupported-wasm-container">
            <span>{c('l10n_nightly Meet')
                .t`Your browser or device software does not support ${MEET_APP_NAME}. Please update your browser or device.`}</span>
        </div>
    );
};
