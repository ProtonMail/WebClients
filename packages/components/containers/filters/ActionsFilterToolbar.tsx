import { c } from 'ttag';

import { Button } from '@proton/atoms';

import { useModalState } from '../../components';
import FilterModal from './modal/FilterModal';
import AdvancedFilterModal from './modal/advanced/AdvancedFilterModal';

function ActionsFilterToolbar() {
    const [filterModalProps, setFilterModalOpen] = useModalState();
    const [advancedFilterModalProps, setAdvancedFilterModalOpen] = useModalState();

    return (
        <>
            <div className="mb1">
                <Button color="norm" onClick={() => setFilterModalOpen(true)} className="mb-2 md:mb-0 mr-4">
                    {c('Action').t`Add filter`}
                </Button>
                <Button shape="outline" onClick={() => setAdvancedFilterModalOpen(true)} className="mb-2 md:mb-0">
                    {c('Action').t`Add sieve filter`}
                </Button>
            </div>
            <FilterModal {...filterModalProps} />
            <AdvancedFilterModal {...advancedFilterModalProps} />
        </>
    );
}

export default ActionsFilterToolbar;
