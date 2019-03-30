import { EVENT_ACTIONS } from '../constants';

const ACTIONS = {
    [EVENT_ACTIONS.DELETE]: 'remove',
    [EVENT_ACTIONS.CREATE]: 'create',
    [EVENT_ACTIONS.UPDATE]: 'update'
};

const updateCollection = (model = [], events) => {
    const copy = [...model];
    const todo = events.reduce(
        (acc, task) => {
            const { Action, ID, modelName } = task;
            const action = ACTIONS[Action];

            if (action === 'remove') {
                acc.remove[ID] = true;
                return acc;
            }

            acc[action].push(task[modelName]);

            return acc;
        },
        { update: [], create: [], remove: Object.create(null) }
    );

    // NOTE We cannot trust Action so "create" and "update" events need to be handle in the way
    const { collection } = [].concat(todo.create, todo.update).reduce(
        (acc, element) => {
            const index = acc.MAP[element.ID];

            if (typeof index !== 'undefined') {
                // index can be set to 0
                // Update
                acc.collection[index] = element;
                return acc;
            }

            // Create
            const length = acc.collection.push(element);
            acc.MAP[element.ID] = length - 1; // index

            return acc;
        },
        {
            collection: copy,
            MAP: copy.reduce((acc, element, index) => {
                acc[element.ID] = index;
                return acc;
            }, {})
        }
    );

    return collection;
};

export default updateCollection;
