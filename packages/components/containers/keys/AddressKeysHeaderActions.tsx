import React from 'react';
import { c } from 'ttag';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { Block, DropdownActions } from '../..';

interface Props {
    onAddKey?: () => void;
    onImportKey?: () => void;
    onExportPublic?: () => void;
    onExportPrivate?: () => void;
}
const AddressKeysHeaderActions = ({ onAddKey, onImportKey, onExportPublic, onExportPrivate }: Props) => {
    const createActions = [
        onAddKey && {
            text: c('Action').t`Create key`,
            onClick: onAddKey,
        },
        onImportKey && {
            text: c('Action').t`Import key`,
            onClick: onImportKey,
        },
    ].filter(isTruthy);

    const exportActions = [
        onExportPublic && {
            text: c('Action').t`Export`,
            onClick: onExportPublic,
        },
        onExportPrivate && {
            text: c('Address action').t`Export private key`,
            onClick: onExportPrivate,
        },
    ].filter(isTruthy);

    if (!exportActions.length && !createActions.length) {
        return null;
    }

    return (
        <Block>
            {createActions.length ? (
                <span className="mr1">
                    <DropdownActions list={createActions} />
                </span>
            ) : null}
            <DropdownActions list={exportActions} />
        </Block>
    );
};

export default AddressKeysHeaderActions;
