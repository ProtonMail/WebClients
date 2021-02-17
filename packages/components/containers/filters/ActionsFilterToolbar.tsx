import React from 'react';
import { c } from 'ttag';
import { Button, PrimaryButton } from '../../components';
import { useModals } from '../../hooks';

import FilterModal from './modal/FilterModal';
import AdvancedFilterModal from './modal/advanced/AdvancedFilterModal';

function ActionsFilterToolbar() {
    const { createModal } = useModals();

    return (
        <>
            <PrimaryButton onClick={() => createModal(<FilterModal />)} className="on-mobile-mb0-5 mr1">{c('Action')
                .t`Add Filter`}</PrimaryButton>
            <Button onClick={() => createModal(<AdvancedFilterModal />)} className="on-mobile-mb0-5">
                {c('Action').t`Add Sieve filter`}
            </Button>
        </>
    );
}

export default ActionsFilterToolbar;
