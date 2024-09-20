import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, Input } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import FileInput from '@proton/components/components/input/FileInput';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { CONTACT_IMG_SIZE } from '@proton/shared/lib/contacts/constants';
import { resizeImage } from '@proton/shared/lib/helpers/image';
import { isValidHttpUrl } from '@proton/shared/lib/helpers/url';
import debounce from '@proton/utils/debounce';

import { ErrorZone, Label } from '../../../components';
import Field from '../../../components/container/Field';
import Row from '../../../components/container/Row';
import { useNotifications } from '../../../hooks';

export interface ContactImageProps extends Omit<ModalProps<typeof Form>, 'onSubmit'> {
    url?: string;
    onSubmit: (image: string) => void;
}

enum ImageState {
    Initial,
    Error,
    Ok,
}

const ContactImageModal = ({ url: initialUrl = '', onSubmit, ...rest }: ContactImageProps) => {
    const [imageUrl, setImageUrl] = useState(initialUrl);
    const [isPristine, setIsPristine] = useState(true);
    const { createNotification } = useNotifications();

    const title = c('Title').t`Edit image`;
    const isBase64Str = imageUrl.startsWith('data:image');

    const [imageState, setImageState] = useState(ImageState.Initial);
    const [isImageLoading, setIsImageLoading] = useState(false);

    const handleSuccess = () => {
        setImageState(ImageState.Ok);
        setIsImageLoading(false);
    };
    const handleError = () => {
        setImageState(ImageState.Error);
        setIsImageLoading(false);
    };

    // Check if the image url is valid
    const checkImageUrl = (url: string) => {
        if (!isValidHttpUrl(url)) {
            setImageState(ImageState.Error);
        } else {
            setIsImageLoading(true);
            const image = new Image();
            image.onload = () => handleSuccess();
            image.onerror = () => handleError();
            image.src = url;
        }
    };

    const debouncedCheckImage = useCallback(
        debounce((url) => {
            checkImageUrl(url);
        }, 200),
        []
    );

    useEffect(() => {
        if (imageUrl) {
            debouncedCheckImage(imageUrl);
        }
    }, [imageUrl]);

    const error = !isPristine && imageState !== ImageState.Ok ? c('Info').t`Not a valid URL` : undefined;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        // Remove parameters from URL otherwise the image is broken
        const urlWithoutParams = e.target.value.split('?')[0];
        setImageUrl(urlWithoutParams);
    };

    const handleSubmit = (event: FormEvent) => {
        event.stopPropagation();
        event.preventDefault();

        onSubmit(imageUrl);
        rest.onClose?.();
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
                rest.onClose?.();
            } catch (error: any) {
                createNotification({ text: c('Error').t`Image upload failed`, type: 'error' });
                throw error;
            }
        };

        reader.readAsDataURL(file);
    };

    return (
        <ModalTwo as={Form} onSubmit={handleSubmit} className="contacts-modal" {...rest}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <Row>
                    <Label htmlFor="contactImageModal-input-url">{c('Label').t`Add image URL`}</Label>
                    <Field>
                        <Input
                            id="contactImageModal-input-url"
                            value={isBase64Str ? '' : imageUrl}
                            onChange={handleChange}
                            onBlur={() => setIsPristine(false)}
                            placeholder={c('Placeholder').t`Image URL`}
                            error={!!error}
                        />
                        {!!error ? <ErrorZone>{error}</ErrorZone> : null}
                    </Field>
                </Row>
                <Row>
                    <Label htmlFor="contactImageModal-input-file">{c('Label').t`Upload picture`}</Label>
                    <Field>
                        <FileInput id="contactImageModal-input-file" accept="image/*" onChange={handleUpload}>{c(
                            'Action'
                        ).t`Upload picture`}</FileInput>
                    </Field>
                </Row>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    type="submit"
                    disabled={imageState === ImageState.Error}
                    loading={isImageLoading}
                >{c('Action').t`Save`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ContactImageModal;
