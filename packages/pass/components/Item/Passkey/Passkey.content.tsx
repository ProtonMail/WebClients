import type { FC } from 'react';

import { c } from 'ttag';

import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { SanitizedPasskey } from '../../../lib/passkeys/types';
import { epochToDateTime } from '../../../utils/time/format';
import { ValueControl } from '../../Form/Field/Control/ValueControl';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';

type Props = { passkey: SanitizedPasskey };

export const PasskeyContent: FC<Props> = ({ passkey }) => (
    <FieldsetCluster mode="read" as="div">
        <ValueControl clickToCopy icon="user" label={c('Label').t`Username`} value={passkey.userName} />
        <ValueControl clickToCopy icon="earth" label={c('Label').t`Domain`} value={passkey.domain} />
        <ValueControl clickToCopy icon="key" label={c('Label').t`Key`} value={passkey.keyId} />
        <ValueControl
            clickToCopy
            icon="calendar-today"
            label={c('Label').t`Created at`}
            value={epochToDateTime(passkey.createTime)}
        />
        {(() => {
            const { creationData } = passkey;
            if (!creationData) return null;

            const { appVersion, osName, osVersion } = creationData;

            return (
                <>
                    <ValueControl
                        icon="info-circle"
                        label={c('Label').t`Device`}
                        ellipsis={false}
                        value={`${osName} ${osVersion}`}
                    />
                    <ValueControl
                        icon="brand-proton-pass"
                        label={c('Label').t`${PASS_SHORT_APP_NAME} version`}
                        value={appVersion}
                    />
                </>
            );
        })()}
    </FieldsetCluster>
);
