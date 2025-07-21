import { c } from 'ttag';

import { Button } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

// import { useTrashNodes } from '../useTrashNodes';
// import { useTrashNotifications } from '../trashNotifications';
import { useActions } from '../../../store';

interface Props {
    disabled?: boolean;
    className?: string;
}
export const EmptyTrashBar = ({ disabled, className }: Props) => {
    // const { emptyTrash } = useTrashNodes();
    // const { confirmModal, createEmptyTrashConfirmModal } = useTrashNotifications();
    const { emptyTrash, confirmModal } = useActions();

    const handleEmptyTrashClick = () => {
        // createEmptyTrashConfirmModal(emptyTrash);
        void emptyTrash(new AbortController().signal);
    };

    return (
        <>
            <div
                className={clsx(
                    className,
                    'empty-trash-notification section--header flex items-center shrink-0 flex-column md:flex-row px-4 py-2'
                )}
            >
                <p className="m-0 md:flex-1 text-sm py-2">
                    {c('Info').t`Items in the trash will stay here until you delete them permanently`}
                </p>
                <Button
                    className="text-sm flex justify-end"
                    color="norm"
                    size="medium"
                    shape="ghost"
                    disabled={disabled}
                    onClick={handleEmptyTrashClick}
                    data-testid="empty-trash"
                >
                    {c('Action').t`Empty trash`}
                </Button>
            </div>
            {confirmModal}
        </>
    );
};
