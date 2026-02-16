import { c } from 'ttag';

import { Input } from '@proton/atoms/Input/Input';
import IconRow from '@proton/components/components/iconRow/IconRow';
import { MAX_CHARS_API, TITLE_INPUT_ID } from '@proton/shared/lib/calendar/constants';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar';

import createHandlers from '../eventForm/createPropFactory';

interface Props {
    canEditSharedEventData: boolean;
    model: EventModel;
    setModel: (value: EventModel) => void;
}

export const RowTitle = ({ canEditSharedEventData, model, setModel }: Props) => {
    if (!canEditSharedEventData) {
        return null;
    }

    return (
        <IconRow icon="text-title" id={TITLE_INPUT_ID} title={c('Label').t`Event title`}>
            <Input
                id={TITLE_INPUT_ID}
                placeholder={c('Placeholder').t`Add title`}
                title={c('Title').t`Add event title`}
                autoFocus
                maxLength={MAX_CHARS_API.TITLE}
                {...createHandlers({ model, setModel, field: 'title' }).native}
            />
        </IconRow>
    );
};
