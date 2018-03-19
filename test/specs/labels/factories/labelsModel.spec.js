import _ from 'lodash';
import service from '../../../../src/app/labels/factories/labelsModel';
import dispatchersService from '../../../../src/app/commons/services/dispatchers';
import { CONSTANTS as constants } from '../../../../src/app/constants';

const sanitize = { input: _.identity, message: _.identity };

describe('labelsModel factory', () => {

    let factory, rootScope;
    const XSS_NAME = 'monique <script>alert("youhou")</script>';
    const XSS_COLOR = '<a href="javascript:dew">deww</a>';
    const getID = () => `${Math.random().toString(32).slice(2, 12)}-${Date.now()}`;
    const mockList = [
        {
            Name: XSS_NAME,
            Color: XSS_COLOR,
            Exclusive: 0,
            Notify: false,
            notify: false
        },
        {
            Name: 'luis',
            Color: '',
            Exclusive: 1,
            Notify: false,
            notify: false
        },
        {
            Name: 'jeanne',
            Color: '',
            Exclusive: 0,
            Notify: false,
            notify: false
        },
        {
            Name: 'serge',
            Color: '',
            Exclusive: 0,
            Notify: false,
            notify: false
        },
        {
            Name: 'jeanne de test',
            Color: '',
            Exclusive: 0,
            Notify: false,
            notify: false
        },
        {
            Name: 'roma',
            Color: '',
            Exclusive: 1,
            Notify: true,
            notify: true
        }
    ].map((item, i) => ((item.ID = getID(), item.Order = i + 1), item));
    const mapMock = mockList.reduce((acc, item) => (acc[item.Name] = _.extend({}, item), acc), {});

    let TODO_CREATE, TODO_UPDATE, TODO_IDS, TODO_DELETE;

    beforeEach(inject(($injector) => {
        rootScope = $injector.get('$rootScope');
        spyOn(rootScope, '$on').and.callThrough();
        spyOn(sanitize, 'input').and.callThrough();
        const dispatchers = dispatchersService(rootScope);
        factory = service(constants, dispatchers, sanitize);
        TODO_IDS = [getID(), getID()];

        TODO_CREATE = [
            {
                ID: 1,
                Action: constants.STATUS.CREATE,
                Label: {
                    Order: 1,
                    Name: 'polo',
                    ID: TODO_IDS[0],
                    Exclusive: 1
                }
            },
            {
                ID: 2,
                Action: constants.STATUS.CREATE,
                Label: {
                    Order: 2,
                    Name: 'jeanne',
                    ID: TODO_IDS[1],
                    Exclusive: 0
                }
            }
        ];

        TODO_UPDATE = [
            {
                ID: TODO_IDS[0],
                Action: constants.STATUS.UPDATE,
                Label: {
                    Order: 1,
                    Name: 'robert',
                    ID: TODO_IDS[0],
                    Exclusive: 1
                }
            }
        ];

        TODO_DELETE = [
            {
                ID: TODO_IDS[1],
                Action: constants.STATUS.DELETE,
                Label: {
                    Order: 1,
                    Name: 'robert',
                    ID: TODO_IDS[1],
                    Exclusive: 1
                }
            }
        ];
    }));

    describe('First load', () => {

        it('should return an empty collection', () => {
            expect(factory.get().length).toBe(0);
        });

        it('should return an empty collection for folders', () => {
            expect(factory.get('folders').length).toBe(0);
        });

        it('should return an empty collection for labels', () => {
            expect(factory.get('labels').length).toBe(0);
        });

        it('should return an empty collection for the map', () => {
            expect(factory.ids().length).toBe(0);
        });

        it('should return an empty collection for the map folders', () => {
            expect(factory.ids('folders').length).toBe(0);
        });

        it('should return an empty collection for the map labels', () => {
            expect(factory.ids('labels').length).toBe(0);
        });
    });

    describe('Set a list', () => {

        beforeEach(() => factory.set(angular.copy(mockList)));

        describe('Clean data', () => {

            it('should purify the data on set', () => {
                expect(sanitize.input).toHaveBeenCalledTimes(12);
            });

            it('should remove potential XSS', () => {
                expect(sanitize.input).toHaveBeenCalledWith(XSS_NAME);
                expect(sanitize.input).toHaveBeenCalledWith(XSS_COLOR);
            });

        });

        it('should not return an empty collection', () => {
            expect(factory.get().length).toBe(mockList.length);
        });

        it('should return 2 folders', () => {
            expect(factory.get('folders').length).toBe(2);
        });

        it('should return 4 labels', () => {
            expect(factory.get('labels').length).toBe(4);
        });

        describe('Order lists', () => {

            it('should order folders', () => {
                const [ { ID: firstID }, { ID: secondID } ] = factory.get('folders');
                expect(firstID).toBe(mapMock.luis.ID);
                expect(secondID).toBe(mapMock.roma.ID);
            });

            it('should order labels', () => {
                const [ { ID: id1 }, { ID: id2 }, { ID: id3 }, { ID: id4 } ] = factory.get('labels');
                expect(id1).toBe(mapMock[XSS_NAME].ID);
                expect(id2).toBe(mapMock.jeanne.ID);
                expect(id3).toBe(mapMock.serge.ID);
                expect(id4).toBe(mapMock['jeanne de test'].ID);
            });

        });

        describe('Ids of labels', () => {

            it('should not return an empty collection for the map', () => {
                expect(factory.ids().length).toBe(mockList.length);
            });

            it('should return 2 ids for the map folders', () => {
                expect(factory.ids('folders').length).toBe(2);
            });

            it('should return 4 ids for the map labels', () => {
                expect(factory.ids('labels').length).toBe(4);
            });

            it('should remove an empty collection if the type isInvalid', () => {
                expect(factory.ids('xxx').length).toBe(0);
            });
        });

        describe('Map accessor', () => {

            it('should access to a label by its id', () => {
                expect(factory.read(mapMock.luis.ID)).toEqual(mapMock.luis);
            });

            it('should access to a label by its id inside a scope', () => {
                expect(factory.read(mapMock.luis.ID, 'folders')).toEqual(mapMock.luis);
                expect(factory.read(mapMock.luis.ID, 'labels')).toEqual(undefined);
            });

            it('should access to a label by its id inside a scope', () => {
                expect(factory.read(mapMock.jeanne.ID, 'folders')).toEqual(undefined);
                expect(factory.read(mapMock.jeanne.ID, 'labels')).toEqual(mapMock.jeanne);
            });

            it('should check if a label exist by its id', () => {
                expect(factory.contains(mapMock.luis.ID)).toBe(true);
                expect(factory.contains(12)).toBe(false);
            });

            it('should check if a label exist by its id inside a scope', () => {
                expect(factory.contains(mapMock.luis.ID, 'folders')).toBe(true);
                expect(factory.contains(mapMock.luis.ID, 'labels')).toBe(false);
            });

            it('should check if a label exist by its id inside a scope', () => {
                expect(factory.contains(mapMock.jeanne.ID, 'folders')).toBe(false);
                expect(factory.contains(mapMock.jeanne.ID, 'labels')).toBe(true);
            });

        });
    });

    describe('Refresh the cache', () => {

        beforeEach(() => {
            spyOn(rootScope, '$emit');
            factory.refresh();
        });

        it('should emit an event', () => {
            expect(rootScope.$emit).toHaveBeenCalledWith('labelsModel', {
                type: 'cache.refresh',
                data: {}
            });
        });
    });

    describe('Flush the cache on logout', () => {

        let dispatch;

        beforeEach(() => {
            factory.set(angular.copy(mockList));
            dispatch = (type, value = true) => rootScope.$emit('AppModel', { type, data: { value } });
        });

        it('should listen to AppModel', () => {
            dispatch('toto');
            expect(rootScope.$on).toHaveBeenCalledWith('AppModel', jasmine.any(Function));
        });

        it('should do nothing if type !== loggedIn', () => {
            dispatch('toto');
            dispatch('toto', false);
            expect(factory.get().length).toBe(mockList.length);
        });

        it('should do nothing if type === loggedIn:true', () => {
            dispatch('loggedIn');
            expect(factory.get().length).toBe(mockList.length);
        });

        it('should flush the cache if type === loggedIn:false', () => {
            dispatch('loggedIn', false);
            expect(factory.get().length).toBe(0);
        });
    });

    describe('Sync events labels', () => {

        describe('Create', () => {
            let folder, label;

            beforeEach(() => {
                [ { Label: folder }, { Label: label } ] = TODO_CREATE;
                spyOn(rootScope, '$emit');
                factory.sync(TODO_CREATE);
            });

            it('should create the collection', () => {
                expect(factory.get().length).toBe(2);
            });

            it('should create one folder', () => {
                expect(factory.get('folders').length).toBe(1);
                expect(factory.read(folder.ID, 'folders')).toEqual(folder);
            });

            it('should create one label', () => {
                expect(factory.get('labels').length).toBe(1);
                expect(factory.read(label.ID, 'labels')).toEqual(label);
            });

            it('should dispatch an event', () => {
                expect(rootScope.$emit).toHaveBeenCalledTimes(1);
                expect(rootScope.$emit).toHaveBeenCalledWith('labelsModel', {
                    type: 'cache.update',
                    data: {
                        create: TODO_CREATE.map(({ Label }) => Label),
                        remove: {},
                        update: []
                    }
                });
            });
        });

        describe('Update', () => {

            let update;
            let remove;
            beforeEach(() => {
                update = TODO_UPDATE[0].Label;
                remove = TODO_DELETE[0].Label;
                factory.sync(TODO_CREATE);
                spyOn(rootScope, '$emit');
                factory.sync(TODO_UPDATE.concat(TODO_DELETE));
            });

            it('should update the collection', () => {
                expect(factory.get().length).toBe(1);
            });

            it('should update one folder', () => {
                expect(factory.get('folders').length).toBe(1);
                expect(factory.read(update.ID, 'folders')).toEqual(update);
            });

            it('should remove the label', () => {
                expect(factory.get('labels').length).toBe(0);
            });

            it('should dispatch an event', () => {
                expect(rootScope.$emit).toHaveBeenCalledTimes(1);
                expect(rootScope.$emit).toHaveBeenCalledWith('labelsModel', {
                    type: 'cache.update',
                    data: {
                        create: [],
                        remove: {
                            [remove.ID]: true
                        },
                        update: [update]
                    }
                });
            });
        });
    });

    describe('Working with references', () => {

        const Name = 'new Name de test';
        const prepareItem = (item, key = 'luis') => {
            item.Name = Name;
            return _.extend({}, mapMock[key], { Name });
        };

        beforeEach(() => factory.set(angular.copy(mockList)));

        it('should update the map after an update of a scoped map: folders', () => {
            const mock = prepareItem(factory.read(mapMock.luis.ID, 'folders'));
            expect(factory.read(mapMock.luis.ID, 'folders')).toEqual(mock);
            expect(factory.read(mapMock.luis.ID)).toEqual(mock);
            expect(factory.read(mapMock.luis.ID)).not.toEqual(mapMock.luis);
        });

        it('should update the list after an update of a scoped map: folders', () => {
            const ID = mapMock.luis.ID;
            const mock = prepareItem(factory.read(ID, 'folders'));
            expect(_.find(factory.get(), { ID })).toEqual(mock);
            expect(_.find(factory.get('folders'), { ID })).toEqual(mock);
            expect(factory.read(ID)).not.toEqual(mapMock.luis);
        });

        it('should get a copy of the list via getters : folders', () => {
            const ID = mapMock.luis.ID;
            const item = _.find(factory.get('folders'), { ID });
            const mock = prepareItem(factory.read(ID, 'folders'));
            expect(item).not.toEqual(mock);
        });

        it('should update the map after an update of a scoped map type:labels', () => {
            const ID = mapMock.jeanne.ID;
            const mock = prepareItem(factory.read(ID, 'labels'), 'jeanne');
            expect(factory.read(ID, 'labels')).toEqual(mock);
            expect(factory.read(ID)).toEqual(mock);
            expect(factory.read(ID)).not.toEqual(mapMock.jeanne);
        });

        it('should update the list after an update of a scoped map type:labels', () => {
            const ID = mapMock.jeanne.ID;
            const mock = prepareItem(factory.read(ID, 'labels'), 'jeanne');
            expect(_.find(factory.get(), { ID })).toEqual(mock);
            expect(_.find(factory.get('labels'), { ID })).toEqual(mock);
            expect(factory.read(ID)).not.toEqual(mapMock.jeanne);
        });

        it('should get a copy of the list via getters : labels', () => {
            const ID = mapMock.jeanne.ID;
            const item = _.find(factory.get('labels'), { ID });
            const mock = prepareItem(factory.read(ID, 'labels'), 'jeanne');
            expect(item).not.toEqual(mock);
        });


        it('should get a copy of the list via getters', () => {
            const item = factory.get()[0];
            item.Name = '42 lol';
            expect(item).not.toEqual(factory.get()[0]);
        });
    });

    describe('Notify', () => {

        it('should contains 1 notify: true', () => {
            expect(mockList.filter(({ notify }) => notify).length).toBe(1);
        });

        it('should set notfy:true for roma', () => {
            expect(mapMock.roma.notify).toBe(true);
        });
    });

});
