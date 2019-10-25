import { EVENT_ACTIONS } from '../constants';

const { DELETE, CREATE, UPDATE } = EVENT_ACTIONS;

function sort(list = [], sortByKey) {
    if (!sortByKey) {
        return list;
    }
    return list.sort((itemA, itemB) => itemA[sortByKey] - itemB[sortByKey]);
}

const defaultMerge = (oldModel, newModel) => {
    return {
        ...oldModel,
        ...newModel
    };
};

/**
 * Update a model collection with incoming events.
 * @param {Array} model
 * @param {Array} events
 * @param {Function} item - A function to return the new model
 * @param {Function} merge - A function to return the merged model
 * @return {Array}
 */
const updateCollection = ({ model = [], events = [], item, merge = defaultMerge }) => {
    const copy = [...model];

    const todo = events.reduce(
        (acc, task) => {
            const { Action, ID } = task;

            if (Action === DELETE) {
                acc[DELETE][ID] = true;
                return acc;
            }

            acc[Action].push(item(task));

            return acc;
        },
        { [UPDATE]: [], [CREATE]: [], [DELETE]: {} }
    );

    const todos = [].concat(todo[CREATE], todo[UPDATE]);
    const sortByKey = ['Order', 'Priority'].find((sortProperty) => sortProperty in (todos[0] || {}));

    // NOTE We cannot trust Action so "create" and "update" events need to be handle in the way
    const { collection } = todos.reduce(
        (acc, element) => {
            const index = acc.MAP[element.ID];

            if (typeof index !== 'undefined') {
                // index can be set to 0
                // Update
                acc.collection[index] = merge(acc.collection[index], element);
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

    return sort(collection, sortByKey).filter(({ ID }) => !todo[DELETE][ID]);
};

export default updateCollection;
