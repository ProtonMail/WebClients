import _ from 'lodash';

/* @ngInject */
function ptDndModel(dispatchers) {
    const CACHE = {};
    const reset = (type) => () => (CACHE[type] = {});
    const { dispatcher, on } = dispatchers(['ptDnd']);

    const dispatch = (type, data = {}) => dispatcher.ptDnd(type, data);

    on('$stateChangeStart', () => {
        reset('draggable');
    });

    const make = (type) => {
        const has = (id) => !!(CACHE[type] || {})[id];
        const get = (id) => (CACHE[type] || {})[id];
        const set = (id, value) => {
            CACHE[type] = CACHE[type] || {};
            if (type === 'draggable' && id !== 'currentId') {
                CACHE[type][id] = _.extend(
                    {
                        selectedList: [],
                        onDragStart(target, event, selectedList = []) {
                            CACHE[type][id].selectedList = selectedList;
                            dispatch('dragstart', {
                                id,
                                target,
                                event,
                                selectedList,
                                model: CACHE[type][id].model,
                                type: CACHE[type][id].type
                            });
                        },
                        onDropItem(event) {
                            dispatch('drop', {
                                event,
                                selectedList: CACHE[type][id].selectedList,
                                model: CACHE[type][id].model,
                                type: CACHE[type][id].type
                            });
                        }
                    },
                    value
                );
            }

            if (type === 'draggable' && id === 'currentId') {
                CACHE[type][id] = value;
            }

            if (type === 'dropzone') {
                CACHE[type][id] = _.extend(
                    {
                        onDragOver(target, event) {
                            dispatch('dragover', {
                                id,
                                target,
                                event,
                                value: CACHE[type][id].value,
                                type: CACHE[type][id].type
                            });
                        },
                        onDropSuccess(event, itemId) {
                            // Dispatch later as we need the drop event to be the first one (get selected items)
                            _rAF(() => {
                                dispatch('dropsuccess', {
                                    itemId,
                                    event,
                                    value: CACHE[type][id].value,
                                    type: CACHE[type][id].type
                                });
                            });
                        }
                    },
                    value
                );
            }
        };

        return { has, set, get, reset: reset(type) };
    };

    return {
        draggable: make('draggable'),
        dropzone: make('dropzone')
    };
}
export default ptDndModel;
