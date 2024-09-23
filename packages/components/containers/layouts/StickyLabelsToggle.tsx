import type { ChangeEvent } from 'react';

import Toggle from '@proton/components/components/toggle/Toggle';
import { STICKY_LABELS } from '@proton/shared/lib/mail/mailSettings';

import { useToggle } from '../../hooks';

const { ENABLED, DISABLED } = STICKY_LABELS;

interface Props {
    id: string;
    stickyLabels: STICKY_LABELS;
    onToggle: (value: STICKY_LABELS) => void;
    loading: boolean;
    disabled?: boolean;
}

const StickyLabelsToggle = ({ id, stickyLabels, onToggle, loading, ...rest }: Props) => {
    const { state, toggle } = useToggle(stickyLabels === ENABLED);

    const handleToggle = ({ target }: ChangeEvent<HTMLInputElement>) => {
        onToggle(target.checked ? ENABLED : DISABLED);
        toggle();
    };

    return <Toggle id={id} checked={state} onChange={handleToggle} loading={loading} {...rest} />;
};

export default StickyLabelsToggle;
