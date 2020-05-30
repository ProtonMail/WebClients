import { EventModel } from '../../../interfaces/EventModel';

const createPropFactory = ({ model, setModel }: { model: EventModel; setModel: (value: EventModel) => void }) => (
    field: keyof EventModel
) => {
    return {
        value: model[field],
        onChange: (value: EventModel[typeof field]) => setModel({ ...model, [field]: value }),
    };
};

export default createPropFactory;
