import { describe, it } from 'mocha';
import assert from 'assert';

import updateCollection from '../../lib/helpers/updateCollection';

describe('update collection', () => {
    it('should remove items from the collection', () => {
        const labels = [
            {
                ID: '123',
                foo: 'bar'
            }
        ];
        const events = [
            {
                ID: '123',
                Action: 0
            }
        ];
        const newLabels = updateCollection(labels, events, 'Label');
        assert.deepStrictEqual(newLabels, []);
    });

    it('should add items to the collection', () => {
        const labels = [
            {
                ID: '123',
                foo: 'bar'
            }
        ];
        const events = [
            {
                ID: '124',
                Action: 1,
                Label: {
                    ID: '124',
                    foo: 'bar2'
                }
            }
        ];
        const newLabels = updateCollection(labels, events, 'Label');
        assert.deepStrictEqual(newLabels, [{ ID: '123', foo: 'bar' }, { ID: '124', foo: 'bar2' }]);
    });

    it('should update items in the collection', () => {
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
                Action: 2,
                Label: {
                    ID: '123',
                    foo: 'bar2'
                }
            }
        ];
        const newLabels = updateCollection(labels, events, 'Label');
        assert.deepStrictEqual(newLabels, [{ ID: '123', foo: 'bar2', kept: true }]);
    });

    it('should delete, create and update items in the collection', () => {
        const labels = [
            {
                ID: '123',
                foo: 'bar'
            }
        ];
        const events = [
            {
                ID: '123',
                Action: 2,
                Label: {
                    ID: '123',
                    foo: 'bar2'
                }
            },
            {
                ID: '123',
                Action: 0
            },
            {
                ID: '124',
                Action: 2,
                Label: {
                    ID: '124',
                    foo: 'bar3'
                }
            },
            {
                ID: '124',
                Action: 1,
                Label: {
                    ID: '124',
                    foo: 'bar'
                }
            }
        ];
        const newLabels = updateCollection(labels, events, 'Label');
        assert.deepStrictEqual(newLabels, [{ ID: '124', foo: 'bar3' }]);
    });
});
