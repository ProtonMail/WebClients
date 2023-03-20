import { c } from 'ttag';

import { DropdownMenuButton, Tooltip } from '@proton/components';

import { useSearchControl } from '../../../store';
import { useConfirmModal } from '../../modals/ConfirmationModal';

interface Props {
    showConfirmModal: ReturnType<typeof useConfirmModal>[1];
}
export default function ClearSearchDataButton({ showConfirmModal }: Props) {
    const { searchEnabled, hasData, deleteData } = useSearchControl();

    if (!hasData || !searchEnabled) {
        return null;
    }

    const handleDeleteESIndex = () => {
        void showConfirmModal({
            onSubmit: deleteData,
            title: c('Info').t`Clear encrypted search data`,
            submitText: c('Info').t`Clear data`,
            message: c('Info')
                .t`Clearing browser data will clear the search index on this device. All files would need to be re-indexed again while using the search functionality.`,
        });
    };

    return (
        <>
            <hr className="mt0-5 mb0-5" />
            <Tooltip title={c('Info').t`Clears browser data related to the encrypted search.`}>
                <DropdownMenuButton onClick={handleDeleteESIndex} className="flex flex-nowrap flex-justify-center">
                    <span className="color-weak">{c('Action').t`Clear browser data`}</span>
                </DropdownMenuButton>
            </Tooltip>
        </>
    );
}
