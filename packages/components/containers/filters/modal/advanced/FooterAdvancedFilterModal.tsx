import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import type { ErrorsSieve } from '../../interfaces';

interface Props {
    onClose: () => void;
    loading: boolean;
    errors: ErrorsSieve;
}

const FooterAdvancedFilterModal = ({ errors, onClose, loading }: Props) => {
    const disabled = loading || !!errors.name;

    return (
        <>
            <Button shape="outline" disabled={loading} onClick={onClose}>{c('Action').t`Cancel`}</Button>
            <Button color="norm" disabled={disabled} type="submit">{c('Action').t`Save`}</Button>
        </>
    );
};

export default FooterAdvancedFilterModal;
