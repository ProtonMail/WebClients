import _ from 'lodash';

import { STATUS } from '../../constants';

const ACTIONS = {
    [STATUS.DELETE]: 'remove',
    [STATUS.CREATE]: 'create',
    [STATUS.UPDATE]: 'update'
};

/**
 * Update collection from events
 * @param  {Array}  [all=[]]
 * @param  {Array}  [events=[]]
 * @param  {String} [type='']
 * @return {Array}
 */
function updateCollection(all = [], events = [], type = '') {
    const copy = all.slice();
    const todo = events.reduce(
        (acc, task) => {
            const { Action, ID } = task;
            const action = ACTIONS[Action];

            if (action === 'remove') {
                acc.remove[ID] = true;
                return acc;
            }

            acc[action].push(task[type]);

            return acc;
        },
        { update: [], create: [], remove: {} }
    );

    // NOTE We cannot trust Action so "create" and "update" events need to be handle in the way
    const { collection } = _.reduce(
        [].concat(todo.create, todo.update),
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
            MAP: _.reduce(copy, (acc, element, index) => ((acc[element.ID] = index), acc), {})
        }
    );

    return {
        collection: _.filter(collection, ({ ID }) => !todo.remove[ID]),
        todo
    };
}

export default updateCollection;
