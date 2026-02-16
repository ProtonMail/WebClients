import { c } from 'ttag';

import { removeVideoConfInfoFromDescription } from '@proton/calendar/videoConferencing/videoConfHelpers';
import IconRow from '@proton/components/components/iconRow/IconRow';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import { DESCRIPTION_INPUT_ID, MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar';

import createHandlers from '../eventForm/createPropFactory';

interface Props {
    canEditSharedEventData: boolean;
    model: EventModel;
    setModel: (value: EventModel) => void;
}

export const RowDescription = ({ canEditSharedEventData, model, setModel }: Props) => {
    if (!canEditSharedEventData) {
        return null;
    }

    return (
        <IconRow
            icon="text-align-left"
            iconClassName="rtl:mirror"
            title={c('Label').t`Description`}
            id={DESCRIPTION_INPUT_ID}
        >
            <TextAreaTwo
                id={DESCRIPTION_INPUT_ID}
                minRows={2}
                autoGrow
                placeholder={c('Placeholder').t`Add description`}
                maxLength={MAX_CHARS_API.EVENT_DESCRIPTION}
                className="max-h-custom"
                title={c('Title').t`Add more information related to this event`}
                {...createHandlers({
                    // We need to remove the video conferencing info from the description to avoid displaying it to users editing the description
                    model: { ...model, description: removeVideoConfInfoFromDescription(model.description) },
                    setModel,
                    field: 'description',
                }).native}
            />
        </IconRow>
    );
};
