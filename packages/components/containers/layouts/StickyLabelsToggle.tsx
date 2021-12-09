import { ChangeEvent } from 'react';
import { STICKY_LABELS } from '@proton/shared/lib/constants';

import { Toggle } from '../../components';
import { useToggle } from '../../hooks';

const { ON, OFF } = STICKY_LABELS;

interface Props {
    id: string;
    stickyLabels: STICKY_LABELS;
    onToggle: (value: STICKY_LABELS) => void;
    loading: boolean;
    disabled?: boolean;
}

const StickyLabelsToggle = ({ id, stickyLabels, onToggle, loading, ...rest }: Props) => {
    const { state, toggle } = useToggle(stickyLabels === ON);

    const handleToggle = ({ target }: ChangeEvent<HTMLInputElement>) => {
        onToggle(target.checked ? ON : OFF);
        toggle();
    };

    return <Toggle id={id} checked={state} onChange={handleToggle} loading={loading} {...rest} />;
};

export default StickyLabelsToggle;
