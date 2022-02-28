import { c } from 'ttag';

import { ConfirmModal, DropdownMenuButton, useModals, Tooltip } from '@proton/components';

import { useSearchControl } from '../../../store';

export default function ClearSearchDataButton() {
    const { createModal } = useModals();
    const { searchEnabled, hasData, deleteData } = useSearchControl();

    if (!hasData || !searchEnabled) {
        return null;
    }

    const handleDeleteESIndex = () => {
        createModal(
            <ConfirmModal
                onConfirm={deleteData}
                title={c('Info').t`Clear encrypted search data`}
                confirm={c('Info').t`Clear data`}
                mode="alert"
            >
                {c('Info')
                    .t`Clearing browser data will clear the search index on this device. All files would need to be re-indexed again while using the search functionality.`}
            </ConfirmModal>
        );
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
