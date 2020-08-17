import { ChangeEvent } from 'react';
import { EventModel } from '../../../interfaces/EventModel';

const createPropFactory = ({ model, setModel }: { model: EventModel; setModel: (value: EventModel) => void }) => (
    field: keyof EventModel,
    useNativeEvent?: boolean
) => {
    return {
        value: model[field],
        onChange:
            useNativeEvent === true
                ? (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                      setModel({ ...model, [field]: event.currentTarget.value })
                : (value: EventModel[typeof field]) => setModel({ ...model, [field]: value }),
    };
};

export default createPropFactory;
