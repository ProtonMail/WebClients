import React from 'react';
import { c } from 'ttag';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { DropdownActions } from '../../components';
import { KeyActions } from './shared/interface';

interface Props extends Partial<KeyActions> {
    isLoading: boolean;
    ID: string;
}
const KeysActions = ({
    isLoading,
    ID,
    onReactivateKey,
    onExportPublicKey,
    onExportPrivateKey,
    onSetPrimary,
    onDeleteKey,
    onSetCompromised,
    onSetNotCompromised,
    onSetObsolete,
    onSetNotObsolete,
}: Props) => {
    const list = [
        onReactivateKey && {
            text: c('Keys actions').t`Reactivate`,
            onClick: () => onReactivateKey(ID),
        },
        onExportPublicKey && {
            text: c('Keys actions').t`Export`,
            onClick: () => onExportPublicKey(ID),
        },
        onExportPrivateKey && {
            text: c('Keys actions').t`Export private key`,
            onClick: () => onExportPrivateKey(ID),
        },
        onSetPrimary && {
            text: c('Keys actions').t`Make primary`,
            onClick: () => onSetPrimary(ID),
        },
        onSetObsolete && {
            text: c('Keys actions').t`Mark obsolete`,
            tooltip: c('Keys actions').t`Disables encryption with this key`,
            onClick: () => onSetObsolete(ID),
        },
        onSetNotObsolete && {
            text: c('Keys actions').t`Mark not obsolete`,
            tooltip: c('Keys actions').t`Enable encryption with this key`,
            onClick: () => onSetNotObsolete(ID),
        },
        onSetCompromised && {
            text: c('Keys actions').t`Mark compromised`,
            tooltip: c('Keys actions').t`Disables signature verification and encryption with this key`,
            onClick: () => onSetCompromised(ID),
        },
        onSetNotCompromised && {
            text: c('Keys actions').t`Mark not compromised`,
            tooltip: c('Keys actions').t`Enable signature verification and encryption with this key`,
            onClick: () => onSetNotCompromised(ID),
        },
        onDeleteKey &&
            ({
                text: c('Keys actions').t`Delete`,
                actionType: 'delete',
                onClick: () => onDeleteKey(ID),
            } as const),
    ].filter(isTruthy);

    return <DropdownActions size="small" loading={isLoading} list={list} />;
};

export default KeysActions;
