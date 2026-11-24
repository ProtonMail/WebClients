import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import MailUpsellButton from '@proton/components/components/upsell/MailUpsellButton';
import FiltersUpsellModal from '@proton/components/components/upsell/modals/FiltersUpsellModal';
import { useFilters } from '@proton/mail/store/filters/hooks';
import { hasReachedFiltersLimit } from '@proton/shared/lib/helpers/filters';

import FilterModal from './modal/FilterModal';
import AdvancedFilterModal from './modal/advanced/AdvancedFilterModal';

function ActionsFilterToolbar() {
    const [user] = useUser();
    const [filterModalProps, setFilterModalOpen, renderFilterModal] = useModalState();
    const [advancedFilterModalProps, setAdvancedFilterModalOpen, renderAdvancedFilterModal] = useModalState();
    const [filters = []] = useFilters();

    const canCreateFilters = !hasReachedFiltersLimit(user, filters);

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    return (
        <>
            {canCreateFilters ? (
                <>
                    <Button color="norm" onClick={() => setFilterModalOpen(true)}>
                        {c('Action').t`Add filter`}
                    </Button>
                    <Button shape="outline" onClick={() => setAdvancedFilterModalOpen(true)}>
                        {c('Action').t`Add sieve filter`}
                    </Button>
                </>
            ) : (
                <MailUpsellButton
                    onClick={() => handleUpsellModalDisplay(true)}
                    text={c('Action').t`Get more filters`}
                />
            )}
            {renderFilterModal && <FilterModal {...filterModalProps} />}
            {renderAdvancedFilterModal && <AdvancedFilterModal {...advancedFilterModalProps} />}

            {renderUpsellModal && <FiltersUpsellModal modalProps={upsellModalProps} isSettings />}
        </>
    );
}

export default ActionsFilterToolbar;
