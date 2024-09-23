import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import FileButton from '@proton/components/components/button/FileButton';
import PrimaryButton from '@proton/components/components/button/PrimaryButton';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { isValidHttpUrl } from '@proton/shared/lib/helpers/url';
import debounce from '@proton/utils/debounce';
import generateUID from '@proton/utils/generateUID';

import Form from '../../form/Form';
import Input from '../../input/Input';
import Label from '../../label/Label';

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
        if (imageSrc) {
            debouncedCheckImage(imageSrc);
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
                <div className="mb-4">
                    <div className="flex flex-nowrap flex-column md:flex-row">
                        <Label htmlFor={`editor-image-address-${uid}`}>{c('Info').t`Add image URL`}</Label>
                        <div className="md:flex-1">
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
                <div className="flex flex-nowrap mb-4 flex-column md:flex-row">
                    <Label htmlFor={`editor-image-upload-${uid}`}>{c('Info').t`Upload picture`}</Label>
                    <div className="md:flex-1" data-testid="insert-image:upload">
                        <FileButton
                            id={`editor-image-upload-${uid}`}
                            className="inline-flex relative items-center"
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
                <PrimaryButton
                    type="submit"
                    disabled={imageState !== ImageState.Ok}
                    data-testid="insert-image:save"
                    loading={isImageLoading}
                >
                    {c('Action').t`Save`}
                </PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default InsertImageModal;
