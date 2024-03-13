import type { FC } from 'react';

import { c } from 'ttag';

import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import { epochToDateTime } from '@proton/pass/utils/time/format';

type Props = { passkey: SanitizedPasskey };

export const PasskeyContent: FC<Props> = ({ passkey }) => (
    <FieldsetCluster mode="read" as="div">
        <ValueControl clickToCopy icon="user" label={c('Label').t`Username`} value={passkey.userName} />
        <ValueControl clickToCopy icon="earth" label={c('Label').t`Domain`} value={passkey.domain} />
        <ValueControl clickToCopy icon="key" label={c('Label').t`Key`} value={passkey.keyId} />
        <ValueControl
            clickToCopy
            icon="calendar-today"
            label={c('Label').t`Created`}
            value={epochToDateTime(passkey.createTime)}
        />
    </FieldsetCluster>
);
