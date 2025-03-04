import React, { type ChangeEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import {
    InputFieldTwo,
    type ModalStateReturnObj,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useFormErrors,
} from '@proton/components';

import { validateLinkNameField } from '../../store';

export const RenameAlbumModal = ({
    renameAlbumModal,
    renameAlbum,
    name,
}: {
    renameAlbumModal: ModalStateReturnObj;
    renameAlbum: (name: string) => Promise<void>;
    name?: string;
}) => {
    const { validator, onFormSubmit } = useFormErrors();
    const [albumName, setAlbumName] = useState<string>(name || '');
    const [loading, setLoading] = useState<boolean>(false);
    const { modalProps, openModal, render } = renameAlbumModal;

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!onFormSubmit()) {
            return;
        }

        setLoading(true);

        void renameAlbum(albumName).finally(() => {
            setLoading(false);
            openModal(false);
        });
    };

    return (
        <>
            {render && (
                <ModalTwo {...modalProps} as="form" onSubmit={onSubmit}>
                    <ModalTwoHeader title={c('Header').t`Rename`} />
                    <ModalTwoContent>
                        <InputFieldTwo
                            autoFocus
                            onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
                                setAlbumName(target.value);
                            }}
                            value={albumName}
                            label={c('Action').t`Album name`}
                            placeholder={c('Action').t`Name your album`}
                            error={validator([validateLinkNameField(albumName) || ''])}
                        />
                    </ModalTwoContent>
                    <ModalTwoFooter>
                        <Button onClick={() => openModal(false)}>{c('Action').t`Cancel`}</Button>
                        <Button color="norm" disabled={!albumName.length} type="submit" loading={loading}>
                            {c('Action').t`Rename`}
                        </Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </>
    );
};
