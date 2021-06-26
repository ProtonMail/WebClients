import { ChangeEvent } from 'react';
import { EventModel } from '@proton/shared/lib/interfaces/calendar';

const createHandlers = ({
    model,
    setModel,
    field,
}: {
    model: EventModel;
    setModel: (value: EventModel) => void;
    field: keyof EventModel;
}) => ({
    native: {
        value: model[field],
        onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setModel({ ...model, [field]: event.currentTarget.value }),
    },
    model: {
        value: model[field],
        onChange: (value: EventModel[typeof field]) => setModel({ ...model, [field]: value }),
    },
});

export default createHandlers;
