import { useState, ChangeEvent } from 'react';
import { c } from 'ttag';

import { isValidHttpUrl } from '@proton/shared/lib/helpers/url';
import { resizeImage } from '@proton/shared/lib/helpers/image';
import { CONTACT_IMG_SIZE } from '@proton/shared/lib/contacts/constants';

import { useNotifications } from '../../../hooks';
import { Row, Label, Field, Input, FileInput, FormModal } from '../../../components';

interface Props {
    url?: string;
    onClose?: () => void;
    onSubmit: (image: string) => void;
}

enum ImageState {
    Initial,
    Error,
    Ok,
}

const ContactImageModal = ({ url: initialUrl = '', onSubmit, onClose, ...rest }: Props) => {
    const [imageUrl, setImageUrl] = useState(initialUrl);
    const { createNotification } = useNotifications();

    const title = c('Title').t`Edit image`;
    const isBase64Str = imageUrl.startsWith('data:image');

    const imageState = (() => {
        if (!imageUrl) {
            return ImageState.Initial;
        } else {
            if (isValidHttpUrl(imageUrl)) {
                return ImageState.Ok;
            } else {
                return ImageState.Error;
            }
        }
    })();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        // Remove parameters from URL otherwise the image is broken
        const urlWithoutParams = e.target.value.split('?')[0];
        setImageUrl(urlWithoutParams);
    };

    const handleSubmit = () => {
        onSubmit(imageUrl);
        onClose?.();
    };

    const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        const reader = new FileReader();

        if (!file) {
            return;
        }

        reader.onloadend = async () => {
            try {
                const base64str = await resizeImage({
                    original: `${reader.result}`,
                    maxWidth: CONTACT_IMG_SIZE,
                    maxHeight: CONTACT_IMG_SIZE,
                    finalMimeType: 'image/jpeg',
                    encoderOptions: 1,
                    bigResize: true,
                });
                onSubmit(base64str);
                onClose?.();
            } catch (error: any) {
                createNotification({ text: c('Error').t`Image upload failed`, type: 'error' });
                throw error;
            }
        };

        reader.readAsDataURL(file);
    };

    return (
        <FormModal
            title={title}
            onSubmit={handleSubmit}
            submit={c('Action').t`Save`}
            onClose={onClose}
            submitProps={{ disabled: imageState === ImageState.Error }}
            {...rest}
        >
            <Row>
                <Label htmlFor="contactImageModal-input-url">{c('Label').t`Add image URL`}</Label>
                <Field>
                    <Input
                        id="contactImageModal-input-url"
                        value={isBase64Str ? '' : imageUrl}
                        onChange={handleChange}
                        placeholder={c('Placeholder').t`Image URL`}
                        error={imageState !== ImageState.Ok ? c('Info').t`Not a valid URL` : undefined}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="contactImageModal-input-file">{c('Label').t`Upload picture`}</Label>
                <Field>
                    <FileInput id="contactImageModal-input-file" accept="image/*" onChange={handleUpload}>{c('Action')
                        .t`Upload picture`}</FileInput>
                </Field>
            </Row>
        </FormModal>
    );
};

export default ContactImageModal;
