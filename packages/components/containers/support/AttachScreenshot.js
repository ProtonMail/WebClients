import React, { useState } from 'react';
import { c } from 'ttag';
import { Icon, Button, FileInput, useNotifications } from 'react-components';
import { toBlob, resize } from 'proton-shared/lib/helpers/image';
import { MAX_SIZE_SCREENSHOT } from 'proton-shared/lib/constants';
import PropTypes from 'prop-types';

const AttachScreenshot = ({ id, onUpload, onReset }) => {
    const [attached, setAttached] = useState(false);
    const { createNotification } = useNotifications();

    const handleClick = () => {
        setAttached(false);
        onReset();
    };

    const handleChange = async ({ target }) => {
        const images = [...target.files].filter(({ type }) => /^image\//i.test(type));

        if (!images.length) {
            return createNotification({
                type: 'error',
                text: c('Error notification in the bug report modal when the user upload file').t`No image selected`
            });
        }

        setAttached(true);
        onUpload(
            await Promise.all(
                images.map((img) =>
                    resize(img, MAX_SIZE_SCREENSHOT).then((base64str) => ({
                        name: img.name,
                        blob: toBlob(base64str)
                    }))
                )
            )
        );
    };

    if (attached) {
        return (
            <>
                <div className="flex flex-nowrap flex-items-center">
                    <Icon name="insert-image" className="mr0-5" />
                    <span className="mr1">{c('Info').t`Screenshot(s) attached`}</span>
                    <Button onClick={handleClick}>{c('Action').t`Clear`}</Button>
                </div>
            </>
        );
    }

    return (
        <FileInput multiple accept="image/*" id={id} onChange={handleChange}>{c('Action')
            .t`Add screenshot(s)`}</FileInput>
    );
};

AttachScreenshot.propTypes = {
    id: PropTypes.string,
    onUpload: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired
};

export default AttachScreenshot;
