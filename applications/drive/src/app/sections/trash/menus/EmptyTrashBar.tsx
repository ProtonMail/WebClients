import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

import { useTrashActions } from '../useTrashActions';
import { useTrashNotifications } from '../useTrashNotifications';

interface Props {
    disabled?: boolean;
    className?: string;
}
export const EmptyTrashBar = ({ disabled, className }: Props) => {
    const { emptyTrash } = useTrashActions();
    const { confirmModal, createEmptyTrashConfirmModal } = useTrashNotifications();

    const handleEmptyTrashClick = () => {
        createEmptyTrashConfirmModal(emptyTrash);
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
