import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Filter } from '@proton/components/containers/filters/interfaces';
import { useFilters } from '@proton/components/hooks';
import { hasReachedFiltersLimit } from '@proton/shared/lib/helpers/filters';

import { FiltersUpsellModal, useModalState } from '../../components';
import useUser from '../../hooks/useUser';
import FilterModal from './modal/FilterModal';
import AdvancedFilterModal from './modal/advanced/AdvancedFilterModal';

function ActionsFilterToolbar() {
    const [user] = useUser();
    const [filterModalProps, setFilterModalOpen] = useModalState();
    const [advancedFilterModalProps, setAdvancedFilterModalOpen] = useModalState();
    const [filters = []] = useFilters() as [Filter[], boolean, Error];

    const canCreateFilters = !hasReachedFiltersLimit(user, filters);

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    return (
        <>
            <div className="mb1">
                {canCreateFilters ? (
                    <>
                        <Button color="norm" onClick={() => setFilterModalOpen(true)} className="mb-2 md:mb-0 mr-4">
                            {c('Action').t`Add filter`}
                        </Button>
                        <Button
                            shape="outline"
                            onClick={() => setAdvancedFilterModalOpen(true)}
                            className="mb-2 md:mb-0"
                        >
                            {c('Action').t`Add sieve filter`}
                        </Button>
                    </>
                ) : (
                    <Button shape="outline" onClick={() => handleUpsellModalDisplay(true)} className="mb-2 md:mb-0">
                        {c('Action').t`Get more filters`}
                    </Button>
                )}
            </div>
            <FilterModal {...filterModalProps} />
            <AdvancedFilterModal {...advancedFilterModalProps} />

            {renderUpsellModal && <FiltersUpsellModal modalProps={upsellModalProps} isSettings />}
        </>
    );
}

export default ActionsFilterToolbar;
