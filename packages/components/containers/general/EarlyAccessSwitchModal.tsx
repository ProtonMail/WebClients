import { APPS_CONFIGURATION } from 'proton-shared/lib/constants';
import React from 'react';
import { c } from 'ttag';

import { Alert, ConfirmModal } from '../../components';
import { useConfig } from '../../hooks';

export type Environment = 'alpha' | 'beta' | 'prod';
interface Props {
    fromEnvironment: Environment;
    toEnvironment: Environment;
    onConfirm: () => void;
    onCancel: () => void;
}

const EarlyAccessSwitchModal = ({ fromEnvironment, toEnvironment, onCancel, onConfirm, ...rest }: Props) => {
    const { APP_NAME } = useConfig();

    const isOptingOut = toEnvironment === 'prod';

    const title = isOptingOut
        ? // translator: to- & fromEnvironment refers to early access programs, can be "alpha" or "beta"
          c('Title').t`Opt out of ${fromEnvironment}`
        : c('Title').t`Opt into ${toEnvironment}`;

    const appName = APPS_CONFIGURATION[APP_NAME].name;

    const alert = isOptingOut
        ? c('Info')
              .t`Please confirm you'd like to opt out of ${appName}'s ${fromEnvironment}, please note you will no longer have access to the latest features. The application will refresh.`
        : c('Info')
              .t`Please confirm you'd like to join the ${toEnvironment} and get access to the latest features available. The application will refresh.`;

    return (
        <ConfirmModal small={false} title={title} onClose={onCancel} onConfirm={onConfirm} {...rest}>
            <Alert>{alert}</Alert>
        </ConfirmModal>
    );
};

export default EarlyAccessSwitchModal;
