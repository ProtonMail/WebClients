import React, { useState, ChangeEvent } from 'react';
import { c } from 'ttag';

import { toBlob, resize } from '@proton/shared/lib/helpers/image';
import { MAX_SIZE_SCREENSHOT } from '@proton/shared/lib/constants';
import { useNotifications } from '../../hooks';
import { Button, FileInput, Icon } from '../../components';

interface Props {
    id: string;
    onUpload: (setImages: any) => void;
    onReset: () => void;
}

const AttachScreenshot = ({ id, onUpload, onReset }: Props) => {
    const [attached, setAttached] = useState(false);
    const { createNotification } = useNotifications();

    const handleClick = () => {
        setAttached(false);
        onReset();
    };

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        const images = target.files ? [...target.files].filter(({ type }) => /^image\//i.test(type)) : [];

        if (!images.length) {
            return createNotification({
                type: 'error',
                text: c('Error notification in the bug report modal when the user upload file').t`No image selected`,
            });
        }

        setAttached(true);
        onUpload(
            await Promise.all(
                images.map((img) =>
                    resize(img, MAX_SIZE_SCREENSHOT).then((base64str) => ({
                        name: img.name,
                        blob: toBlob(base64str),
                    }))
                )
            )
        );
    };

    if (attached) {
        return (
            <>
                <div className="flex flex-nowrap flex-align-items-center">
                    <Icon name="insert-image" className="mr0-5" />
                    <span className="mr1 flex-item-fluid">{c('Info').t`Screenshot(s) attached`}</span>
                    <Button onClick={handleClick}>{c('Action').t`Clear`}</Button>
                </div>
            </>
        );
    }

    return (
        <FileInput className="flex" multiple accept="image/*" id={id} onChange={handleChange}>{c('Action')
            .t`Add screenshot(s)`}</FileInput>
    );
};

export default AttachScreenshot;
