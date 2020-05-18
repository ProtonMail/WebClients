import React from 'react';
import { c } from 'ttag';
import { Button, PrimaryButton, useModals } from 'react-components';

import AddFilterModal from './AddFilterModal';

function ActionsFilterToolbar() {
    const { createModal } = useModals();

    const handleClickAdd = (type) => () => {
        createModal(<AddFilterModal type={type} />);
    };

    return (
        <>
            <PrimaryButton onClick={handleClickAdd()} className="onmobile-mb0-5 mr1">{c('Action')
                .t`Add Filter`}</PrimaryButton>
            <Button onClick={handleClickAdd('complex')} className="onmobile-mb0-5">
                {c('Action').t`Add sieve filter`}
            </Button>
        </>
    );
}

export default ActionsFilterToolbar;
