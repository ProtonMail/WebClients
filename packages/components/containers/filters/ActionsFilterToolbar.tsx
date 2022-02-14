import { c } from 'ttag';
import { Button, useModalState } from '../../components';

import FilterModal from './modal/FilterModal';
import AdvancedFilterModal from './modal/advanced/AdvancedFilterModal';

function ActionsFilterToolbar() {
    const [{ open: isFilterModalOpen, ...filterModalProps }, setFilterModalOpen] = useModalState();
    const [{ open: isAdvancedFilterModalOpen, ...advancedFilterModalProps }, setAdvancedFilterModalOpen] =
        useModalState();

    return (
        <>
            <div className="mb1">
                <Button color="norm" onClick={() => setFilterModalOpen(true)} className="on-mobile-mb0-5 mr1">
                    {c('Action').t`Add filter`}
                </Button>
                <Button shape="outline" onClick={() => setAdvancedFilterModalOpen(true)} className="on-mobile-mb0-5">
                    {c('Action').t`Add sieve filter`}
                </Button>
            </div>
            <FilterModal {...filterModalProps} isOpen={isFilterModalOpen} />
            <AdvancedFilterModal {...advancedFilterModalProps} isOpen={isAdvancedFilterModalOpen} />
        </>
    );
}

export default ActionsFilterToolbar;
