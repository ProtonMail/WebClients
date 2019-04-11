import { describe, it } from 'mocha';
import assert from 'assert';

import updateCollection from '../../lib/helpers/updateCollection';
import { EVENT_ACTIONS } from '../../lib/constants';

describe('update collection', () => {
    it('should remove items', () => {
        const labels = [
            {
                ID: '123',
                foo: 'bar'
            }
        ];
        const events = [
            {
                ID: '123',
                Action: EVENT_ACTIONS.DELETE
            }
        ];
        const newLabels = updateCollection(labels, events, 'Label');
        assert.deepStrictEqual(newLabels, []);
    });

    it('should add items', () => {
        const labels = [
            {
                ID: '123',
                foo: 'bar'
            }
        ];
        const events = [
            {
                ID: '124',
                Action: EVENT_ACTIONS.CREATE,
                Label: {
                    ID: '124',
                    foo: 'bar2'
                }
            }
        ];
        const newLabels = updateCollection(labels, events, 'Label');
        assert.deepStrictEqual(newLabels, [{ ID: '123', foo: 'bar' }, { ID: '124', foo: 'bar2' }]);
    });

    it('should update items', () => {
        const labels = [
            {
                ID: '123',
                foo: 'bar',
                kept: true
            }
        ];
        const events = [
            {
                ID: '123',
                Action: EVENT_ACTIONS.UPDATE,
                Label: {
                    ID: '123',
                    foo: 'bar2'
                }
            }
        ];
        const newLabels = updateCollection(labels, events, 'Label');
        assert.deepStrictEqual(newLabels, [{ ID: '123', foo: 'bar2', kept: true }]);
    });

    it('should delete, create and update items', () => {
        const labels = [
            {
                ID: '123',
                foo: 'bar'
            }
        ];
        const events = [
            {
                ID: '123',
                Action: EVENT_ACTIONS.UPDATE,
                Label: {
                    ID: '123',
                    foo: 'bar2'
                }
            },
            {
                ID: '123',
                Action: EVENT_ACTIONS.DELETE
            },
            {
                ID: '124',
                Action: EVENT_ACTIONS.UPDATE,
                Label: {
                    ID: '124',
                    foo: 'bar3'
                }
            },
            {
                ID: '124',
                Action: EVENT_ACTIONS.CREATE,
                Label: {
                    ID: '124',
                    foo: 'bar'
                }
            }
        ];
        const newLabels = updateCollection(labels, events, 'Label');
        assert.deepStrictEqual(newLabels, [{ ID: '124', foo: 'bar3' }]);
    });

    describe('Sort collection', () => {
        it('should delete, create and update items and sort them', () => {
            const labels = [
                {
                    ID: '123',
                    foo: 'bar',
                    Order: 1
                }
            ];
            const events = [
                {
                    ID: '123',
                    Action: EVENT_ACTIONS.UPDATE,
                    Label: {
                        ID: '123',
                        foo: 'bar2'
                    }
                },
                {
                    ID: '12345',
                    Action: EVENT_ACTIONS.CREATE,
                    Label: {
                        ID: '12345',
                        foo: 'monique',
                        Order: 2
                    }
                },
                {
                    ID: '124',
                    Action: EVENT_ACTIONS.CREATE,
                    Label: {
                        ID: '124',
                        foo: 'bar',
                        Order: 3
                    }
                }
            ];
            const newLabels = updateCollection(labels, events, 'Label');
            assert.deepStrictEqual(newLabels, [
                { ID: '123', foo: 'bar2', Order: 1 },
                { ID: '12345', foo: 'monique', Order: 2 },
                { ID: '124', foo: 'bar', Order: 3 }
            ]);

            const events2 = [
                {
                    ID: '123',
                    Action: EVENT_ACTIONS.DELETE
                },
                {
                    ID: '124',
                    Action: EVENT_ACTIONS.UPDATE,
                    Label: {
                        ID: '124',
                        foo: 'bar3',
                        Order: 1
                    }
                }
            ];

            const newLabels2 = updateCollection(newLabels, events2, 'Label');
            assert.deepStrictEqual(newLabels2, [
                { ID: '124', foo: 'bar3', Order: 1 },
                { ID: '12345', foo: 'monique', Order: 2 }
            ]);
        });

        it('should delete, create and update items and not sort them', () => {
            const labels = [
                {
                    ID: '123',
                    foo: 'bar'
                }
            ];
            const events = [
                {
                    ID: '123',
                    Action: EVENT_ACTIONS.UPDATE,
                    Label: {
                        ID: '123',
                        foo: 'bar2'
                    }
                },
                {
                    ID: '12345',
                    Action: EVENT_ACTIONS.CREATE,
                    Label: {
                        ID: '12345',
                        foo: 'monique'
                    }
                },
                {
                    ID: '124',
                    Action: EVENT_ACTIONS.CREATE,
                    Label: {
                        ID: '124',
                        foo: 'bar'
                    }
                }
            ];
            const newLabels = updateCollection(labels, events, 'Label');
            assert.deepStrictEqual(newLabels, [
                { ID: '123', foo: 'bar2' },
                { ID: '12345', foo: 'monique' },
                { ID: '124', foo: 'bar' }
            ]);

            const events2 = [
                {
                    ID: '123',
                    Action: EVENT_ACTIONS.DELETE
                },
                {
                    ID: '124',
                    Action: EVENT_ACTIONS.UPDATE,
                    Label: {
                        ID: '124',
                        foo: 'bar3'
                    }
                }
            ];

            const newLabels2 = updateCollection(newLabels, events2, 'Label');
            assert.deepStrictEqual(newLabels2, [{ ID: '12345', foo: 'monique' }, { ID: '124', foo: 'bar3' }]);
        });
    });
});
