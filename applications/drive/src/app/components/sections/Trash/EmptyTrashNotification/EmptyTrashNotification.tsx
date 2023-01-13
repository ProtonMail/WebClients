import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import clsx from '@proton/utils/clsx';

import useActiveShare from '../../../../hooks/drive/useActiveShare';
import { useActions } from '../../../../store';

interface Props {
    disabled?: boolean;
    className?: string;
}
const EmptyTrashNotification = ({ disabled, className }: Props) => {
    const { activeShareId } = useActiveShare();
    const { emptyTrash } = useActions();

    const handleEmptyTrashClick = () => {
        void emptyTrash(new AbortController().signal, activeShareId);
    };

    return (
        <div
            className={clsx(
                className,
                'empty-trash-notification section--header flex flex-align-items-center on-mobile-flex-column p1 pt0-5 pb0-5 on-mobile-pb0-5'
            )}
        >
            <p className="m0 flex-item-fluid text-sm pt0-5 pb0-5">
                {c('Info').t`Items in the trash will stay here until you delete them permanently`}
            </p>
            <Button
                className="text-sm flex flex-justify-end"
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
    );
};

export default EmptyTrashNotification;
