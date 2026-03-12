import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { QuickSettingsButton, type useConfirmActionModal } from '@proton/components';

import { useSearchModule } from '../../../hooks/search/useSearchModule';

interface Props {
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

export const ClearSearchDataButton = ({ showConfirmModal }: Props) => {
    const searchModule = useSearchModule();

    if (!searchModule.isAvailable) {
        return null;
    }

    const handleDeleteClicked = () => {
        void showConfirmModal({
            onSubmit: async () => {
                await searchModule.reset();
            },
            title: c('Info').t`Clear all search data`,
            submitText: c('Info').t`Clear data`,
            message: c('Info')
                .t`Clearing browser data will clear the search index on this device. All files would need to be re-indexed again while using the search functionality.`,
        });
    };

    return (
        <>
            <Tooltip title={c('Info').t`Clears browser data related to the search.`}>
                <QuickSettingsButton onClick={handleDeleteClicked}>
                    {c('Action').t`Clear browser data`}
                </QuickSettingsButton>
            </Tooltip>
        </>
    );
};
