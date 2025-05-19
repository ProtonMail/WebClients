import React, { type ChangeEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
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
    share,
}: {
    createAlbumModal: ModalStateReturnObj;
    createAlbum: (name: string) => Promise<void>;
    share: boolean;
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
                    <ModalTwoHeader
                        title={share ? c('Header').t`Create new shared album` : c('Header').t`Create new album`}
                    />
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
                            {c('Action').t`Create`}
                        </Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </>
    );
};
