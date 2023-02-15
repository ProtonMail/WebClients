import { c } from 'ttag';

import { ModalTwoHeader } from '@proton/components';

const StepProductsHeader = () => {
    return <ModalTwoHeader title={c('Title').t`What would you like to import?`} />;
};

export default StepProductsHeader;
