import { c } from 'ttag';

import type { useConfirmActionModal } from '@proton/components';
import { QuickSettingsButton, Tooltip } from '@proton/components';

import { useEncryptedSearchLibrary } from '../../EncryptedSearchLibraryProvider';
import { useCalendarSearch } from '../search/CalendarSearchProvider';

interface Props {
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
    onBackFromSearch: () => void;
}
const NukeSearchIndexButton = ({ showConfirmModal, onBackFromSearch }: Props) => {
    const { esDelete } = useEncryptedSearchLibrary();
    const { isActive: isSearchActive, isSearching, setIsSearching } = useCalendarSearch();

    if (!isSearchActive) {
        return null;
    }

    const handleDeleteESIndex = () => {
        void showConfirmModal({
            onSubmit: async () => {
                void esDelete();
                if (isSearching) {
                    setIsSearching(false);
                    onBackFromSearch();
                }
            },
            title: c('Info').t`Clear encrypted search data`,
            submitText: c('Info').t`Clear data`,
            message: c('Info')
                .t`Clearing browser data will clear the search index on this device. All calendar events would need to be re-indexed again to use the search functionality.`,
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
};

export default NukeSearchIndexButton;
