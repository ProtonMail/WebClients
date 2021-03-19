import React, { useState, ChangeEvent } from 'react';
import { c } from 'ttag';

import { generateUID } from '../../../helpers';
import FormModal from '../../modal/FormModal';
import { Button, PrimaryButton } from '../../button';
import Label from '../../label/Label';
import Input from '../../input/Input';
import Alert from '../../alert/Alert';
import TextLoader from '../../loader/TextLoader';
import LoaderIcon from '../../loader/LoaderIcon';

import ReactiveImage from './ReactiveImage';
import FileButton from '../../button/FileButton';
import Icon from '../../icon/Icon';

enum ImageState {
    Initial,
    Loading,
    Error,
    Ok,
}

interface Props {
    onAddUrl: (url: string) => void;
    onAddImages: (files: File[]) => void;
    onClose?: () => void;
}

const InsertImageModal = ({ onAddUrl, onAddImages, onClose, ...rest }: Props) => {
    const [uid] = useState(generateUID('editor-image-modal'));
    const [imageSrc, setImageSrc] = useState<string>();
    const [imageState, setImageState] = useState(ImageState.Initial);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setImageSrc(event.target.value);
    };

    const handleLoading = () => setImageState(ImageState.Loading);
    const handleSuccess = () => setImageState(ImageState.Ok);
    const handleError = () => setImageState(ImageState.Error);

    const handleSubmit = () => {
        onAddUrl(imageSrc as string);
        onClose?.();
    };

    const handleAddFiles = (files: File[]) => {
        onAddImages(files);
        onClose?.();
    };

    return (
        <FormModal
            title={c('Info').t`Insert image`}
            onSubmit={handleSubmit}
            onClose={onClose}
            footer={
                <>
                    <Button type="reset">{c('Action').t`Cancel`}</Button>
                    <FileButton className="inline-flex relative flex-align-items-center" onAddFiles={handleAddFiles}>
                        <Icon name="attach" /> {c('Action').t`Add file`}
                    </FileButton>
                    <PrimaryButton type="submit" disabled={imageState !== ImageState.Ok}>
                        {c('Action').t`Insert`}
                    </PrimaryButton>
                </>
            }
            {...rest}
        >
            <div className="flex flex-nowrap mb1 on-mobile-flex-column">
                <Label htmlFor={`editor-image-address-${uid}`}>{c('Info').t`Web address`}</Label>
                <div className="flex-item-fluid">
                    <Input
                        id={`editor-image-address-${uid}`}
                        type="text"
                        autoComplete="off"
                        error={imageState === ImageState.Error ? c('Info').t`Not a valid URL` : undefined}
                        onChange={handleChange}
                    />
                </div>
            </div>
            <div className="flex flex-nowrap mb1 on-mobile-flex-column">
                <Label htmlFor={`editor-image-preview-${uid}`}>{c('Info').t`Image preview`}</Label>
                <div className="flex-item-fluid">
                    <ReactiveImage
                        src={imageSrc}
                        onLoading={handleLoading}
                        onSuccess={handleSuccess}
                        onError={handleError}
                    />

                    {imageState !== ImageState.Ok && (
                        <Alert>
                            {c('Info')
                                .t`If your URL is correct, you'll see an image preview here. Large images may take a few minutes to appear.`}
                        </Alert>
                    )}

                    {imageState === ImageState.Loading && (
                        <span>
                            <TextLoader>
                                <LoaderIcon /> {c('Info').t`Loading image`}
                            </TextLoader>
                        </span>
                    )}

                    {imageState === ImageState.Error && (
                        <span className="color-global-warning">{c('Info').t`Error loading image`}</span>
                    )}
                </div>
            </div>
        </FormModal>
    );
};

export default InsertImageModal;
