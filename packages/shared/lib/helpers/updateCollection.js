import { EVENT_ACTIONS } from '../constants';

const { DELETE, CREATE, UPDATE } = EVENT_ACTIONS;

const updateCollection = (model = [], events, itemModelName) => {
    const copy = [...model];

    const todo = events.reduce(
        (acc, task) => {
            const { Action, ID } = task;

            if (Action === DELETE) {
                acc[DELETE][ID] = true;
                return acc;
            }

            acc[Action].push(task[itemModelName]);

            return acc;
        },
        { [UPDATE]: [], [CREATE]: [], [DELETE]: {} }
    );

    // NOTE We cannot trust Action so "create" and "update" events need to be handle in the way
    const { collection } = [].concat(todo[CREATE], todo[UPDATE]).reduce(
        (acc, element) => {
            const index = acc.MAP[element.ID];

            if (typeof index !== 'undefined') {
                // index can be set to 0
                // Update
                acc.collection[index] = {
                    ...acc.collection[index],
                    ...element
                };
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

    return collection.filter(({ ID }) => !todo[DELETE][ID]);
};

export default updateCollection;
