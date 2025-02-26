import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import {
    type ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useModalTwoStatic,
} from '@proton/components';
import useLoading from '@proton/hooks/useLoading';

export const RemoveAlbumPhotosModal = ({
    selectedPhotosIds,
    missingPhotosIds,
    removeAlbumPhotos,
    ...modalProps
}: {
    selectedPhotosIds: string[];
    missingPhotosIds: string[];
    removeAlbumPhotos: (params: { missingPhotosIds?: string[]; selectedPhotosIds: string[] }) => Promise<void>;
} & ModalStateProps) => {
    const [isRemoveWithSaveLoading, withRemoveWithSaveLoading] = useLoading(false);
    const [isRemoveLoading, withRemoveLoading] = useLoading(false);

    const handleSubmit = (withSave: boolean) => {
        return removeAlbumPhotos({
            missingPhotosIds: withSave ? missingPhotosIds : undefined,
            selectedPhotosIds,
        }).finally(() => {
            modalProps.onClose();
        });
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        return handleSubmit(true);
    };

    return (
        <ModalTwo {...modalProps} as="form" onSubmit={(e) => withRemoveWithSaveLoading(() => onSubmit(e))} size="large">
            <ModalTwoHeader title={c('Title').t`Remove items`} />
            <ModalTwoContent>
                <p>
                    {c('Info')
                        .t`This item isn't saved in your Photos library. If you remove it from this album, you’ll lose access to it permanently. Would you like to save it before removing?`}
                </p>
            </ModalTwoContent>
            <ModalTwoFooter className="flex space-between flex-nowrap">
                <Button
                    disabled={isRemoveLoading || isRemoveWithSaveLoading}
                    className="shrink-1"
                    onClick={modalProps.onClose}
                >{c('Action').t`Cancel`}</Button>
                <div className="flex gap-2">
                    <Button
                        disabled={isRemoveWithSaveLoading}
                        onClick={() => withRemoveLoading(() => handleSubmit(false))}
                        loading={isRemoveLoading}
                    >
                        {c('Action').t`Remove Without Saving`}
                    </Button>
                    <Button disabled={isRemoveLoading} color="norm" type="submit" loading={isRemoveWithSaveLoading}>
                        {c('Action').t`Save and Remove`}
                    </Button>
                </div>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const useRemoveAlbumPhotosModal = () => {
    return useModalTwoStatic(RemoveAlbumPhotosModal);
};
