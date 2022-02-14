import { c } from 'ttag';
import { Button, useModalState } from '../../components';
import { useModals } from '../../hooks';

import FilterModal from './modal/FilterModal';
import AdvancedFilterModal from './modal/advanced/AdvancedFilterModal';

function ActionsFilterToolbar() {
    const { createModal } = useModals();

    const [{ open: isFilterModalOpen, ...filterModalProps }, setFilterModalOpen] = useModalState();

    return (
        <>
            <div className="mb1">
                <Button color="norm" onClick={() => setFilterModalOpen(true)} className="on-mobile-mb0-5 mr1">
                    {c('Action').t`Add filter`}
                </Button>
                <Button
                    shape="outline"
                    onClick={() => createModal(<AdvancedFilterModal />)}
                    className="on-mobile-mb0-5"
                >
                    {c('Action').t`Add sieve filter`}
                </Button>
            </div>
            <FilterModal {...filterModalProps} isOpen={isFilterModalOpen} />
        </>
    );
}

export default ActionsFilterToolbar;
