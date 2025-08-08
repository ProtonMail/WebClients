import { EVENT_ACTIONS } from '../../lib/constants';
import updateCollection, { sortCollection } from '../../lib/helpers/updateCollection';

describe('update collection', () => {
    it('should remove items', () => {
        const labels = [
            {
                ID: '123',
                foo: 'bar',
            },
        ];
        const events = [
            {
                ID: '123',
                Action: EVENT_ACTIONS.DELETE,
            },
        ] as const;
        const newLabels = updateCollection({
            model: labels,
            events,
            itemKey: 'Label',
        });
        expect(newLabels).toEqual([]);
    });

    it('should add items', () => {
        const labels = [
            {
                ID: '123',
                foo: 'bar',
            },
        ];
        const events = [
            {
                ID: '124',
                Action: EVENT_ACTIONS.CREATE,
                Label: {
                    ID: '124',
                    foo: 'bar2',
                },
            },
        ] as const;
        const newLabels = updateCollection({ model: labels, events, itemKey: 'Label' });
        expect(newLabels).toEqual([
            { ID: '123', foo: 'bar' },
            { ID: '124', foo: 'bar2' },
        ]);
    });

    it('should update items', () => {
        const labels = [
            {
                ID: '123',
                foo: 'bar',
                kept: true,
            },
        ];
        const events = [
            {
                ID: '123',
                Action: EVENT_ACTIONS.UPDATE,
                Label: {
                    ID: '123',
                    foo: 'bar2',
                },
            },
        ] as const;
        const newLabels = updateCollection({ model: labels, events, itemKey: 'Label' });
        expect(newLabels).toEqual([{ ID: '123', foo: 'bar2', kept: true }]);
    });

    it('should delete, create and update items', () => {
        const labels = [
            {
                ID: '123',
                foo: 'bar',
            },
        ];
        const events = [
            {
                ID: '123',
                Action: EVENT_ACTIONS.UPDATE,
                Label: {
                    ID: '123',
                    foo: 'bar2',
                },
            },
            {
                ID: '123',
                Action: EVENT_ACTIONS.DELETE,
            },
            {
                ID: '124',
                Action: EVENT_ACTIONS.UPDATE,
                Label: {
                    ID: '124',
                    foo: 'bar3',
                },
            },
            {
                ID: '124',
                Action: EVENT_ACTIONS.CREATE,
                Label: {
                    ID: '124',
                    foo: 'bar',
                },
            },
        ] as const;
        const newLabels = updateCollection({ model: labels, events, itemKey: 'Label', item: ({ Label }) => Label });
        expect(newLabels).toEqual([{ ID: '124', foo: 'bar3' }]);
    });

    describe('Sort collection', () => {
        it('should delete, create and update items and sort them', () => {
            const labels = [
                {
                    ID: '123',
                    foo: 'bar',
                    Order: 1,
                },
            ];
            const events = [
                {
                    ID: '123',
                    Action: EVENT_ACTIONS.UPDATE,
                    Label: {
                        ID: '123',
                        foo: 'bar2',
                    },
                },
                {
                    ID: '12345',
                    Action: EVENT_ACTIONS.CREATE,
                    Label: {
                        ID: '12345',
                        foo: 'monique',
                        Order: 2,
                    },
                },
                {
                    ID: '124',
                    Action: EVENT_ACTIONS.CREATE,
                    Label: {
                        ID: '124',
                        foo: 'bar',
                        Order: 3,
                    },
                },
            ] as const;
            const newLabels = updateCollection({ model: labels, events, itemKey: 'Label', item: ({ Label }) => Label });
            const key = 'Order';
            const sortedLabels = sortCollection(key, newLabels);
            expect(sortedLabels).toEqual([
                { ID: '123', foo: 'bar2', Order: 1 },
                { ID: '12345', foo: 'monique', Order: 2 },
                { ID: '124', foo: 'bar', Order: 3 },
            ]);

            const events2 = [
                {
                    ID: '123',
                    Action: EVENT_ACTIONS.DELETE,
                },
                {
                    ID: '124',
                    Action: EVENT_ACTIONS.UPDATE,
                    Label: {
                        ID: '124',
                        foo: 'bar3',
                        Order: 1,
                    },
                },
            ] as const;

            const newLabels2 = updateCollection({
                model: newLabels,
                events: events2,
                itemKey: 'Label',
                item: ({ Label }) => Label,
            });
            const sortedLabels2 = sortCollection(key, newLabels2);
            expect(sortedLabels2).toEqual([
                { ID: '124', foo: 'bar3', Order: 1 },
                { ID: '12345', foo: 'monique', Order: 2 },
            ]);
        });

        it('should delete, create and update items and not sort them', () => {
            const labels = [
                {
                    ID: '123',
                    foo: 'bar',
                },
            ];
            const events = [
                {
                    ID: '123',
                    Action: EVENT_ACTIONS.UPDATE,
                    Label: {
                        ID: '123',
                        foo: 'bar2',
                    },
                },
                {
                    ID: '12345',
                    Action: EVENT_ACTIONS.CREATE,
                    Label: {
                        ID: '12345',
                        foo: 'monique',
                    },
                },
                {
                    ID: '124',
                    Action: EVENT_ACTIONS.CREATE,
                    Label: {
                        ID: '124',
                        foo: 'bar',
                    },
                },
            ] as const;
            const newLabels = updateCollection({ model: labels, events, itemKey: 'Label' });
            expect(newLabels).toEqual([
                { ID: '123', foo: 'bar2' },
                { ID: '12345', foo: 'monique' },
                { ID: '124', foo: 'bar' },
            ]);

            const events2 = [
                {
                    ID: '123',
                    Action: EVENT_ACTIONS.DELETE,
                },
                {
                    ID: '124',
                    Action: EVENT_ACTIONS.UPDATE,
                    Label: {
                        ID: '124',
                        foo: 'bar3',
                    },
                },
            ] as const;

            const newLabels2 = updateCollection({
                model: newLabels,
                events: events2,
                itemKey: 'Label',
                item: ({ Label }) => Label,
            });
            expect(newLabels2).toEqual([
                { ID: '12345', foo: 'monique' },
                { ID: '124', foo: 'bar3' },
            ]);
        });

        it('should delete, create and update items and not sort them by a custom key', () => {
            const labels = [
                {
                    ID: '122',
                    foo: 'bar',
                    counter: 3,
                },
                {
                    ID: '123',
                    foo: 'bar',
                    counter: 1,
                },
            ];
            const events = [
                {
                    ID: '123',
                    Action: EVENT_ACTIONS.UPDATE,
                    Label: {
                        ID: '123',
                        foo: 'bar2',
                        counter: 5,
                    },
                },
                {
                    ID: '12345',
                    Action: EVENT_ACTIONS.CREATE,
                    Label: {
                        ID: '12345',
                        foo: 'monique',
                        counter: 2,
                    },
                },
                {
                    ID: '124',
                    Action: EVENT_ACTIONS.CREATE,
                    Label: {
                        ID: '124',
                        foo: 'bar',
                        counter: 3,
                    },
                },
            ] as const;
            const newLabels = sortCollection('counter', updateCollection({ model: labels, events, itemKey: 'Label' }));
            expect(newLabels).toEqual([
                { ID: '12345', foo: 'monique', counter: 2 },
                { ID: '122', foo: 'bar', counter: 3 },
                { ID: '124', foo: 'bar', counter: 3 },
                { ID: '123', foo: 'bar2', counter: 5 },
            ]);
        });
    });

    describe('key other than ID', () => {
        it('should delete items', () => {
            const labels = [
                {
                    LabelID: '123',
                    foo: 'bar',
                },
            ];
            const events = [
                {
                    ID: '123',
                    Action: EVENT_ACTIONS.DELETE,
                },
            ] as const;
            const newLabels = updateCollection({
                model: labels,
                events,
                itemKey: 'Label',
                item: ({ Label }) => Label,
                idKey: 'LabelID',
            });
            expect(newLabels).toEqual([]);
        });

        it('should update items', () => {
            const labels = [
                {
                    LabelID: '123',
                    foo: 'bar',
                },
            ];
            const events = [
                {
                    ID: '123',
                    Action: EVENT_ACTIONS.UPDATE,
                    Label: {
                        LabelID: '123',
                        foo: 'bar2',
                    },
                },
            ] as const;
            const newLabels = updateCollection({
                model: labels,
                events,
                itemKey: 'Label',
                item: ({ Label }) => Label,
                idKey: 'LabelID',
            });
            expect(newLabels).toEqual([{ LabelID: '123', foo: 'bar2' }]);
        });

        it('should create items ', () => {
            const labels = [
                {
                    LabelID: '123',
                    foo: 'bar',
                },
            ];
            const events = [
                {
                    ID: '124',
                    Action: EVENT_ACTIONS.CREATE,
                    Label: {
                        LabelID: '124',
                        foo: 'bar',
                    },
                },
            ] as const;
            const newLabels = updateCollection({
                model: labels,
                events,
                itemKey: 'Label',
                item: ({ Label }) => Label,
                idKey: 'LabelID',
            });
            expect(newLabels).toEqual([
                { LabelID: '123', foo: 'bar' },
                { LabelID: '124', foo: 'bar' },
            ]);
        });

        it('should delete, create and update items', () => {
            const labels = [
                {
                    LabelID: '123',
                    foo: 'bar',
                },
            ];
            const events = [
                {
                    ID: '123',
                    Action: EVENT_ACTIONS.UPDATE,
                    Label: {
                        LabelID: '123',
                        foo: 'bar2',
                    },
                },
                {
                    ID: '123',
                    Action: EVENT_ACTIONS.DELETE,
                },
                {
                    ID: '124',
                    Action: EVENT_ACTIONS.UPDATE,
                    Label: {
                        LabelID: '124',
                        foo: 'bar3',
                    },
                },
                {
                    ID: '124',
                    Action: EVENT_ACTIONS.CREATE,
                    Label: {
                        LabelID: '124',
                        foo: 'bar',
                    },
                },
            ] as const;
            const newLabels = updateCollection({
                model: labels,
                events,
                itemKey: 'Label',
                item: ({ Label }) => Label,
                idKey: 'LabelID',
            });
            expect(newLabels).toEqual([{ LabelID: '124', foo: 'bar3' }]);
        });
    });
});
