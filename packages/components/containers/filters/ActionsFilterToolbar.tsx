import React from 'react';
import { c } from 'ttag';
import { Button } from '../../components';
import { useModals } from '../../hooks';

import FilterModal from './modal/FilterModal';
import AdvancedFilterModal from './modal/advanced/AdvancedFilterModal';

function ActionsFilterToolbar() {
    const { createModal } = useModals();

    return (
        <div className="mb1">
            <Button color="norm" onClick={() => createModal(<FilterModal />)} className="on-mobile-mb0-5 mr1">
                {c('Action').t`Add filter`}
            </Button>
            <Button shape="outline" onClick={() => createModal(<AdvancedFilterModal />)} className="on-mobile-mb0-5">
                {c('Action').t`Add sieve filter`}
            </Button>
        </div>
    );
}

export default ActionsFilterToolbar;
