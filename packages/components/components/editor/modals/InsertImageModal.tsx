import { useState, ChangeEvent, useEffect } from 'react';
import { c } from 'ttag';

import { generateUID } from '../../../helpers';
import { Button, PrimaryButton } from '../../button';
import Label from '../../label/Label';
import Input from '../../input/Input';
import { Form } from '../../form';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../modalTwo';

import FileButton from '../../button/FileButton';

enum ImageState {
    Initial,
    Loading,
    Error,
    Ok,
}

interface Props {
    onAddUrl?: (url: string) => void;
    onAddImages?: (files: File[]) => void;
    onClose?: () => void;
}

const InsertImageModal = ({ onAddUrl, onAddImages, onClose, ...rest }: Props) => {
    const [uid] = useState(generateUID('editor-image-modal'));
    const [imageSrc, setImageSrc] = useState<string>();
    const [imageState, setImageState] = useState(ImageState.Initial);

    const handleSuccess = () => setImageState(ImageState.Ok);
    const handleError = () => setImageState(ImageState.Error);

    // Check if the image url is valid
    const checkImageUrl = (url: string) => {
        const image = new Image();
        image.onload = () => handleSuccess();
        image.onerror = () => handleError();
        image.src = url;
    };

    useEffect(() => {
        if (imageSrc) {
            checkImageUrl(imageSrc);
        }
    }, [imageSrc]);

    const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
        setImageSrc(event.target.value);
    };

    const handleSubmit = () => {
        onAddUrl?.(imageSrc as string);
        onClose?.();
    };

    const handleAddFiles = (files: File[]) => {
        onAddImages?.(files);
        onClose?.();
    };

    return (
        <ModalTwo size="large" as={Form} onSubmit={handleSubmit} onClose={onClose} {...rest}>
            <ModalTwoHeader title={c('Info').t`Insert image`} onSubmit={handleSubmit} />
            <ModalTwoContent>
                <div className="mb1">
                    <div className="flex flex-nowrap on-mobile-flex-column">
                        <Label htmlFor={`editor-image-address-${uid}`}>{c('Info').t`Add image URL`}</Label>
                        <div className="flex-item-fluid">
                            <Input
                                id={`editor-image-address-${uid}`}
                                type="text"
                                autoComplete="off"
                                placeholder={c('Info').t`Image URL`}
                                error={imageState === ImageState.Error ? c('Info').t`Not a valid URL` : undefined}
                                onChange={handleChange}
                                data-testid="insert-image:url"
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
                <div className="flex flex-nowrap mb1 on-mobile-flex-column">
                    <Label htmlFor={`editor-image-upload-${uid}`}>{c('Info').t`Upload picture`}</Label>
                    <div className="flex-item-fluid" data-testid="insert-image:upload">
                        <FileButton
                            id={`editor-image-upload-${uid}`}
                            className="inline-flex relative flex-align-items-center"
                            onAddFiles={handleAddFiles}
                        >
                            {c('Action').t`Upload picture`}
                        </FileButton>
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" data-testid="insert-image:cancel" onClick={onClose}>{c('Action')
                    .t`Cancel`}</Button>
                <PrimaryButton type="submit" disabled={imageState !== ImageState.Ok} data-testid="insert-image:save">
                    {c('Action').t`Save`}
                </PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default InsertImageModal;
