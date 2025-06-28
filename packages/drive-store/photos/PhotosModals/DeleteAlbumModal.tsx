import { useState } from 'react';

import { c } from 'ttag';

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
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

export type DeleteAlbumModalProps = {
    name: string;
    deleteAlbum: (force: boolean, childLinkIds?: string[]) => Promise<void>;
    onDeleted?: () => void;
};

export const DeleteAlbumModal = ({
    deleteAlbum,
    name,
    onDeleted,
    ...modalProps
}: DeleteAlbumModalProps & ModalStateProps) => {
    const [isDeleteWithSaveLoading, withDeleteWithSaveLoading] = useLoading(false);
    const [isDeleteLoading, withDeleteLoading] = useLoading(false);
    const [childLinkIds, setChildLinkIds] = useState<string[] | undefined>(undefined);

    // This whole case will happend if some photos in Album are direct children of it
    // BE will send us an error code with list of linkIds.
    // In that case we show the with save / without save modal to the user
    const handleSubmit = async (force: boolean) => {
        try {
            await deleteAlbum(force, childLinkIds);
            onDeleted?.();
            modalProps.onClose();
        } catch (e: unknown) {
            const error = e as {
                data?: {
                    Code?: number;
                    Details?: {
                        ChildLinkIDs?: string[];
                    };
                };
            };
            if (
                error.data?.Code === API_CUSTOM_ERROR_CODES.ALBUM_DATA_LOSS &&
                error.data.Details?.ChildLinkIDs?.length
            ) {
                setChildLinkIds(error.data.Details?.ChildLinkIDs);
            } else {
                modalProps.onClose();
                throw e;
            }
        }
    };

    const onSubmit = (e: React.FormEvent, force: boolean = false) => {
        e.preventDefault();
        return handleSubmit(force);
    };

    // translator: ${name} is for a folder/file/album name.
    const title = c('Title').t`Delete ${name}?`;

    if (!childLinkIds?.length) {
        return (
            <ModalTwo
                {...modalProps}
                as="form"
                onSubmit={(e) => withDeleteLoading(() => onSubmit(e, false))}
                size="small"
            >
                <ModalTwoHeader title={title} />
                <ModalTwoContent>
                    <p>
                        {c('Info')
                            .t`This will only delete the album. Your photos will remain in your timeline. This action cannot be undone.`}
                    </p>
                </ModalTwoContent>
                <ModalTwoFooter className="flex space-between flex-nowrap">
                    <Button disabled={isDeleteLoading} className="shrink-1" onClick={modalProps.onClose}>{c('Action')
                        .t`Cancel`}</Button>
                    <Button color="danger" type="submit" loading={isDeleteLoading}>
                        {c('Action').t`Delete album`}
                    </Button>
                </ModalTwoFooter>
            </ModalTwo>
        );
    }

    return (
        <ModalTwo
            {...modalProps}
            as="form"
            onSubmit={(e) => withDeleteWithSaveLoading(() => onSubmit(e, false))}
            size="large"
        >
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <p>
                    {c('Info')
                        .t`Some photos in this album are not saved to your timeline. Deleting this album will permanently delete those photos.`}
                </p>
                <p>{c('Info').t`Would you like to save them before removing?`}</p>
            </ModalTwoContent>
            <ModalTwoFooter className="flex space-between flex-nowrap">
                <Button
                    disabled={isDeleteLoading || isDeleteWithSaveLoading}
                    className="shrink-1"
                    onClick={modalProps.onClose}
                >{c('Action').t`Cancel`}</Button>
                <div className="flex gap-2">
                    <Button
                        disabled={isDeleteWithSaveLoading}
                        onClick={() => withDeleteLoading(() => handleSubmit(true))}
                        loading={isDeleteLoading}
                    >
                        {c('Action').t`Delete without saving`}
                    </Button>
                    <Button disabled={isDeleteLoading} color="norm" type="submit" loading={isDeleteWithSaveLoading}>
                        {c('Action').t`Save photos and remove`}
                    </Button>
                </div>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const useDeleteAlbumModal = () => {
    return useModalTwoStatic(DeleteAlbumModal);
};
