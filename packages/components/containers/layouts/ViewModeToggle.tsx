import type { ChangeEvent } from 'react';

import Toggle from '@proton/components/components/toggle/Toggle';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { useToggle } from '../../hooks';

const { GROUP, SINGLE } = VIEW_MODE;

interface Props {
    viewMode: VIEW_MODE;
    onToggle: (viewMode: VIEW_MODE) => void;
    loading: boolean;
    id: string;
}

const ViewModeToggle = ({ viewMode, onToggle, loading, id, ...rest }: Props) => {
    const { state, toggle } = useToggle(viewMode === GROUP);

    const handleToggle = ({ target }: ChangeEvent<HTMLInputElement>) => {
        onToggle(target.checked ? GROUP : SINGLE);
        toggle();
    };

    return <Toggle id={id} checked={state} onChange={handleToggle} loading={loading} {...rest} />;
};

export default ViewModeToggle;
