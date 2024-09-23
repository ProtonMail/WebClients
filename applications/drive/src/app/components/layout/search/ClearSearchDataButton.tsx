import { c } from 'ttag';

import type { useConfirmActionModal } from '@proton/components';
import { QuickSettingsButton, Tooltip } from '@proton/components';

import { useSearchControl } from '../../../store';

interface Props {
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
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
            <Tooltip title={c('Info').t`Clears browser data related to the encrypted search.`}>
                <QuickSettingsButton onClick={handleDeleteESIndex}>
                    {c('Action').t`Clear browser data`}
                </QuickSettingsButton>
            </Tooltip>
        </>
    );
}
