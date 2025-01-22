import React, { type ChangeEvent, useState } from 'react';

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
                    <ModalTwoHeader title="Create new album" />
                    <ModalTwoContent>
                        <InputFieldTwo
                            autoFocus
                            onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
                                setAlbumName(target.value);
                            }}
                            value={albumName}
                            //label="What this input field is about"
                            //hint="Any hint on filling this input field"
                            //assistiveText="Assistive text explaining how to fill this input field…"
                            placeholder="Name your album"
                            // title="Help displayed on hovering this input field, and read by screen readers too."
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
