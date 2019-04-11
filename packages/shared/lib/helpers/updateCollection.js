import { EVENT_ACTIONS } from '../constants';

const { DELETE, CREATE, UPDATE } = EVENT_ACTIONS;

function sort(list = [], hasSort) {
    if (!hasSort) {
        return list;
    }
    return list.sort((itemA, itemB) => itemA.Order - itemB.Order);
}

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

    const todos = [].concat(todo[CREATE], todo[UPDATE]);
    const hasSort = 'Order' in (todos[0] || {});

    // NOTE We cannot trust Action so "create" and "update" events need to be handle in the way
    const { collection } = todos.reduce(
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
            }, Object.create(null))
        }
    );

    return sort(collection, hasSort).filter(({ ID }) => !todo[DELETE][ID]);
};

export default updateCollection;
