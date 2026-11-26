import type { FC } from 'react';

import { c } from 'ttag';

import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { PauseList } from './PauseList/PauseListPolicy';

/** The table only renders when the plan includes policies: the pause-list endpoint refuses other plans. */
export const PassPauseListPolicy: FC<{ upgradeRequired: boolean }> = ({ upgradeRequired }) => (
    <>
        <div className="color-weak">
            {c('Description')
                .t`You can customize the list of domains where certain auto functions in ${PASS_APP_NAME} browser extension (Autofill, Autosuggest, Autosave) should not be run.`}
        </div>
        <div className="color-weak mb-4 text-semibold">
            {c('Description').t`A checked box means the feature is disabled.`}
        </div>
        {!upgradeRequired && <PauseList upgradeRequired={false} />}
    </>
);
