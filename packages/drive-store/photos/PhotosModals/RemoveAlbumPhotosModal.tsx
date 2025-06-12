import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
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
    selectedPhotosCount,
    removeAlbumPhotos,
    ...modalProps
}: {
    selectedPhotosCount: number;
    removeAlbumPhotos: (withSave: boolean) => Promise<void>;
} & ModalStateProps) => {
    const [isRemoveWithSaveLoading, withRemoveWithSaveLoading] = useLoading(false);
    const [isRemoveLoading, withRemoveLoading] = useLoading(false);

    const handleSubmit = (withSave: boolean) => {
        return removeAlbumPhotos(withSave).finally(() => {
            modalProps.onClose();
        });
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        return handleSubmit(true);
    };

    return (
        <ModalTwo {...modalProps} as="form" onSubmit={(e) => withRemoveWithSaveLoading(() => onSubmit(e))} size="large">
            <ModalTwoHeader title={c('Title').ngettext(msgid`Remove item?`, `Remove items?`, selectedPhotosCount)} />
            <ModalTwoContent>
                <p>
                    {c('Info').ngettext(
                        msgid`This item isn't saved in your Photos library. If you remove it from this album, you’ll lose access to it permanently.`,
                        `Some of the selected items aren’t saved in your Photos library. If you remove them from this album, you’ll lose access to them permanently.`,
                        selectedPhotosCount
                    )}
                </p>
                <p>
                    {c('Info').ngettext(
                        msgid`Would you like to save it before removing?`,
                        `Would you like to save them before removing?`,
                        selectedPhotosCount
                    )}
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
                        {c('Action').t`Remove without saving`}
                    </Button>
                    <Button disabled={isRemoveLoading} color="norm" type="submit" loading={isRemoveWithSaveLoading}>
                        {c('Action').t`Save and remove`}
                    </Button>
                </div>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const useRemoveAlbumPhotosModal = () => {
    return useModalTwoStatic(RemoveAlbumPhotosModal);
};
