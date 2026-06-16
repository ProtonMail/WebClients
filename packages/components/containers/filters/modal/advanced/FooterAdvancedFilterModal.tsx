import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import type { ErrorsSieve } from '../../interfaces';

interface Props {
    onClose: () => void;
    loading: boolean;
    errors: ErrorsSieve;
    helperOpen: boolean;
    onToggleHelper: () => void;
}

const FooterAdvancedFilterModal = ({ errors, onClose, loading, helperOpen, onToggleHelper }: Props) => {
    const showHelper = useFlag(MailFeatureFlag.LumoSieveHelper);
    const disabled = loading || !!errors.name;

    return (
        <>
            <Button shape="outline" disabled={loading} onClick={onClose} className="mr-auto">{c('Action')
                .t`Cancel`}</Button>
            {showHelper && (
                <Button
                    shape="ghost"
                    color="weak"
                    disabled={loading}
                    onClick={onToggleHelper}
                    className="inline-flex items-center gap-2"
                >
                    <img src={lumoCatIcon} alt="" className="w-custom" style={{ '--w-custom': '1.25rem' }} />
                    {helperOpen
                        ? c('Action').t`Hide ${LUMO_SHORT_APP_NAME}`
                        : c('Action').t`Get help from ${LUMO_SHORT_APP_NAME}`}
                </Button>
            )}
            <Button color="norm" disabled={disabled} type="submit">{c('Action').t`Save`}</Button>
        </>
    );
};

export default FooterAdvancedFilterModal;
