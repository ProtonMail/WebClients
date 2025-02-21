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

export const CreateAlbumModal = ({
    createAlbumModal,
    createAlbum,
}: {
    createAlbumModal: ModalStateReturnObj;
    createAlbum: (name: string) => Promise<void>;
}) => {
    const { validator, onFormSubmit } = useFormErrors();
    const [albumName, setAlbumName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const { modalProps, openModal, render } = createAlbumModal;

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!onFormSubmit()) {
            return;
        }

        setLoading(true);

        void createAlbum(albumName).finally(() => {
            setLoading(false);
            openModal(false);
        });
    };

    return (
        <>
            {render && (
                <ModalTwo {...modalProps} as="form" onSubmit={onSubmit}>
                    <ModalTwoHeader title={c('Header').t`Create new album`} />
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
                        <Button onClick={() => openModal(false)}>Cancel</Button>
                        <Button color="norm" disabled={!albumName.length} type="submit" loading={loading}>
                            Create
                        </Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </>
    );
};
