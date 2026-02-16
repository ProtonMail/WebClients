import { c } from 'ttag';

import { Input } from '@proton/atoms/Input/Input';
import IconRow from '@proton/components/components/iconRow/IconRow';
import { LOCATION_INPUT_ID, MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar';

import createHandlers from '../eventForm/createPropFactory';

interface Props {
    canEditSharedEventData: boolean;
    model: EventModel;
    setModel: (value: EventModel) => void;
}

export const RowLocation = ({ canEditSharedEventData, model, setModel }: Props) => {
    if (!canEditSharedEventData) {
        return null;
    }

    return (
        <IconRow icon="map-pin" title={c('Label').t`Location`} id={LOCATION_INPUT_ID}>
            <Input
                id={LOCATION_INPUT_ID}
                placeholder={c('Placeholder').t`Add location`}
                maxLength={MAX_CHARS_API.LOCATION}
                title={c('Title').t`Add event location`}
                {...createHandlers({ model, setModel, field: 'location' }).native}
            />
        </IconRow>
    );
};
