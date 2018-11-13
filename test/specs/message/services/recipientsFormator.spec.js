import _ from 'lodash';

import factory from '../../../../src/app/message/services/recipientsFormator';
import { log } from '../../../utils/helpers';
import {
    input as inputFormat,
    output as outputFormat,
    details as detailsFormat
} from '../../../mocks/recipientsFormator/format'
import {
    input as inputList,
    output as outputList,
    details as detailsList
} from '../../../mocks/recipientsFormator/list'


let mockCallComposerContactGroupSelection = _.noop;
const mockComposerContactGroupSelection = {
    get: _.noop,
    save: _.noop,
    storeDraftConfig: _.noop,
    getDraftConfig: _.noop,
    removeDraftConfig: _.noop
};
const composerContactGroupSelection = (ID) => {
    mockCallComposerContactGroupSelection(ID);
    return mockComposerContactGroupSelection;
};

const contactGroupModel = {
    getExport: _.noop,
    readName: _.noop
};

const contactEmails = {
    findEmails: _.noop
};


describe('[message/services] ~ recipientsFormator', () => {
    let service;

    beforeEach(() => {
        service = factory(contactGroupModel, composerContactGroupSelection, contactEmails);
    });

    describe('List recipients', () => {

        describe('Open a draft with nothing', () => {

            let output;

            beforeEach(() => {
                mockCallComposerContactGroupSelection = jasmine.createSpy();
                spyOn(mockComposerContactGroupSelection, 'storeDraftConfig');
                spyOn(contactGroupModel, 'readName').and.callFake(detailsList.groupModel)

                output = service.list({ ID: inputList.MessageID });
            });

            it('should not call the cache scoped by MessageID', () => {
                expect(mockCallComposerContactGroupSelection).toHaveBeenCalledTimes(0);
            });

            it('should not try to access to the cache group', () => {
                expect(contactGroupModel.readName).toHaveBeenCalledTimes(0);
            });

            it('should not save a cache for the draft', () => {
                expect(mockComposerContactGroupSelection.storeDraftConfig).toHaveBeenCalledTimes(0);
            });

            it('should list everything', () => {
                const { ToList, CCList, BCCList } = output;
                expect(ToList.length).toBe(0)
                expect(CCList.length).toBe(0)
                expect(BCCList.length).toBe(0)
            })
        });

        describe('Open a draft with no-groups + contacts and user have them too', () => {

            let output;
            const list = inputList.list.filter((item) => !item.Group);
            const [ToList, ...CCList] = list;

            const { toList: outputToList, ccList: outputCCList } =  outputList
                .filter((item) => !item.isContactGroup)
                .reduce((acc, item) => {
                    if (item.Address === ToList.Address) {
                        acc.toList.push(item);
                        return acc;
                    }
                    acc.ccList.push(item);
                    return acc;
                }, { ccList: [], toList: [] });

            beforeEach(() => {
                mockCallComposerContactGroupSelection = jasmine.createSpy();
                spyOn(mockComposerContactGroupSelection, 'storeDraftConfig');
                spyOn(contactGroupModel, 'readName').and.callFake(detailsList.groupModel)

                output = service.list({
                    ID: inputList.MessageID,
                    ToList: [ ToList ],
                    CCList
                });
            });

            it('should call the cache scoped by MessageID', () => {
                expect(mockCallComposerContactGroupSelection).toHaveBeenCalledTimes(2);
                expect(mockCallComposerContactGroupSelection)
                    .toHaveBeenCalledWith(inputList.MessageID);

            });

            it('should not try to access to the cache group', () => {
                expect(contactGroupModel.readName).toHaveBeenCalledTimes(0);
            });

            it('should save a cache for the draft', () => {
                expect(mockComposerContactGroupSelection.storeDraftConfig).toHaveBeenCalledTimes(2);
            });

            it('should save a cache for the draft ToList', () => {
                expect(mockComposerContactGroupSelection
                    .storeDraftConfig).toHaveBeenCalledWith('ToList', {});
            });

            it('should save a cache for the draft CCList', () => {
                expect(mockComposerContactGroupSelection
                    .storeDraftConfig).toHaveBeenCalledWith('CCList', {});
            });


            it('should list ToList', () => {
                const { ToList, CCList, BCCList } = output;
                expect(ToList).toEqual(outputToList)
                expect(CCList).toEqual(outputCCList)
                expect(BCCList.length).toBe(0)
            })
        });

        describe('Open a draft with groups only and user have them too', () => {
            let output;

            const list = inputList.list.filter((item) => item.Group);
            const MAP = _.groupBy(list, 'Group');
            const [ ccKey, ...bccKeys ] = Object.keys(MAP);
            const CCList = MAP[ccKey];
            const BCCList = _.flatten(bccKeys.map((key) => MAP[key]));

            const { ccList: outputCCList, bccList: outputBCCList } =  outputList
                .filter((item) => item.isContactGroup)
                .reduce((acc, item) => {
                    if (item.Name === ccKey) {
                        acc.ccList.push(item);
                        return acc;
                    }
                    acc.bccList.push(item);
                    return acc;
                }, { ccList: [], bccList: [] });


            beforeEach(() => {
                mockCallComposerContactGroupSelection = jasmine.createSpy();
                spyOn(mockComposerContactGroupSelection, 'storeDraftConfig');
                spyOn(contactGroupModel, 'readName').and.callFake(detailsList.groupModel)

                output = service.list({
                    ID: inputList.MessageID,
                    CCList,
                    BCCList
                });
            });

            it('should call the cache scoped by MessageID', () => {
                expect(mockCallComposerContactGroupSelection).toHaveBeenCalledTimes(2);
                expect(mockCallComposerContactGroupSelection)
                    .toHaveBeenCalledWith(inputList.MessageID);

            });

            it('should not try to access to the cache group', () => {
                expect(contactGroupModel.readName).toHaveBeenCalledTimes(7);
            });

            it('should not try to access to the cache group Name', () => {
                const names = Object.keys(MAP);
                const namesArg = _.uniqBy(_.flatten(contactGroupModel.readName.calls.allArgs()));

                names.forEach((name) => {
                    expect(contactGroupModel.readName)
                        .toHaveBeenCalledWith(name);
                });

                expect(namesArg).toEqual(names);
            });

            it('should save a cache for the draft', () => {
                expect(mockComposerContactGroupSelection.storeDraftConfig).toHaveBeenCalledTimes(2);
            });


            it('should save a cache for the draft CCList', () => {
                const ID = outputCCList[0].Address;
                expect(mockComposerContactGroupSelection
                    .storeDraftConfig)
                    .toHaveBeenCalledWith('CCList', {
                        [ID]: detailsList.MAPS.groupStore[ID]
                    });
            });

            it('should save a cache for the draft BCCList', () => {
                const ids = outputBCCList.map(({ Address }) => Address);
                const config = ids.reduce((acc, key) => {
                    acc[key] = detailsList.MAPS.groupStore[key];
                    return acc;
                }, {});
                expect(mockComposerContactGroupSelection
                    .storeDraftConfig)
                    .toHaveBeenCalledWith('BCCList', config);
            });

            it('should fill correct keys', () => {
                const { ToList, CCList, BCCList } = output;
                expect(ToList.length).toBe(0)
                expect(CCList).toEqual(outputCCList)
                expect(BCCList).toEqual(outputBCCList)
            })
        });

        describe('Open a draft with groups + contacts and user have them too', () => {
            let output;

            beforeEach(() => {
                mockCallComposerContactGroupSelection = jasmine.createSpy();
                spyOn(mockComposerContactGroupSelection, 'storeDraftConfig');
                spyOn(contactGroupModel, 'readName').and.callFake(detailsList.groupModel)

                output = service.list({
                    ID: inputList.MessageID,
                    ToList: inputList.list
                });
            });

            it('should call the cache scoped by MessageID', () => {
                expect(mockCallComposerContactGroupSelection).toHaveBeenCalledTimes(1);
                expect(mockCallComposerContactGroupSelection)
                    .toHaveBeenCalledWith(inputList.MessageID);
            });


            it('should not try to access to the cache group', () => {
                expect(contactGroupModel.readName).toHaveBeenCalledTimes(7);
            });

            it('should not try to access to the cache group Name', () => {
                const names = Object.keys(detailsList.MAPS.MAP_NAME_ID);
                const namesArg = _.uniqBy(_.flatten(contactGroupModel.readName.calls.allArgs()));

                names.forEach((name) => {
                    expect(contactGroupModel.readName)
                        .toHaveBeenCalledWith(name);
                });

                expect(namesArg).toEqual(names);
            });

            it('should save a cache for the draft', () => {
                const names = Object.keys(detailsList.MAPS.MAP_NAME_ID);

                expect(mockComposerContactGroupSelection.storeDraftConfig).toHaveBeenCalledTimes(1);
                expect(mockComposerContactGroupSelection
                    .storeDraftConfig).toHaveBeenCalledWith('ToList', detailsList.MAPS.groupStore);
            });


            it('should list ToList', () => {
                const { ToList, CCList, BCCList } = output;
                expect(ToList).toEqual(outputList)
                expect(CCList.length).toBe(0)
                expect(BCCList.length).toBe(0)
            })
        });
    });

    describe('Format recipients', () => {

        describe('Open a draft with nothing', () => {

            let output;

            beforeEach(async () => {
                mockCallComposerContactGroupSelection = jasmine.createSpy();
                spyOn(mockComposerContactGroupSelection, 'save');
                spyOn(mockComposerContactGroupSelection, 'removeDraftConfig');
                spyOn(mockComposerContactGroupSelection, 'get');
                spyOn(mockComposerContactGroupSelection, 'getDraftConfig').and.callFake((type) => {
                    if (type === 'ToList') {
                        return detailsFormat.MAPS.draftList;
                    }
                });
                spyOn(contactEmails, 'findEmails').and.callFake((address) => {
                    const id = detailsFormat.MAPS.MOCK_CONTACT_EMAILS[address.toString()];
                    return detailsFormat.MAPS.GROUP_EMAILS[id];
                });

                spyOn(contactGroupModel, 'getExport').and.callFake((ID) => {
                    return detailsFormat.MAPS.GROUP_EMAILS[ID];
                });

                output = await service.format({
                    ID: inputFormat.MessageID
                });
            });

            it('should not call the cache scoped by MessageID', () => {
                expect(mockCallComposerContactGroupSelection).toHaveBeenCalledTimes(0);
            });

            it('should not try to access to the cache', () => {
                expect(mockComposerContactGroupSelection.get).toHaveBeenCalledTimes(0);
            });

            it('should not try to access to the cache for a draft', () => {
                expect(mockComposerContactGroupSelection.getDraftConfig).toHaveBeenCalledTimes(0);
            });

            it('should not export the config for a group', () => {
                expect(contactGroupModel.getExport).toHaveBeenCalledTimes(0);
            });

            it('should not remove the config for the draft', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledTimes(0);
            });

            it('should not save the config by group', () => {
                expect(mockComposerContactGroupSelection.save).toHaveBeenCalledTimes(0);
            });

            it('should format every list', async () => {
                const { ToList, CCList, BCCList } = output;
                expect(ToList.length).toBe(0)
                expect(CCList.length).toBe(0)
                expect(BCCList.length).toBe(0)
            })
        });

        describe('Open a draft with only groups + contacts and user have them too', () => {

            let output;
            const list = inputFormat.list.filter((item) => item.isContactGroup);
            const [CCList, ...BCCList] = list;

            const { ccList: outputCCFormat, bccList: outputBCCFormat } = outputFormat
                .filter((item) => item.Group)
                .reduce((acc, item) => {
                    if (item.Group === CCList.Name) {
                        acc.ccList.push(item);
                        return acc;
                    }
                    acc.bccList.push(item);
                    return acc;
                }, { bccList: [], ccList: [] });


            beforeEach(async () => {
                mockCallComposerContactGroupSelection = jasmine.createSpy();
                spyOn(mockComposerContactGroupSelection, 'save');
                spyOn(mockComposerContactGroupSelection, 'removeDraftConfig');
                spyOn(mockComposerContactGroupSelection, 'get');
                spyOn(mockComposerContactGroupSelection, 'getDraftConfig').and.callFake((type) => {
                    if (type === 'ToList') {
                        return detailsFormat.MAPS.draftList;
                    }
                });
                spyOn(contactEmails, 'findEmails').and.callFake((address) => {
                    const id = detailsFormat.MAPS.MOCK_CONTACT_EMAILS[address.toString()];
                    return detailsFormat.MAPS.GROUP_EMAILS[id];
                });

                spyOn(contactGroupModel, 'getExport').and.callFake((ID) => {
                    return detailsFormat.MAPS.GROUP_EMAILS[ID];
                });

                output = await service.format({
                    ID: inputFormat.MessageID,
                    CCList: [ CCList ],
                    BCCList
                });
            });

            it('should call the cache scoped by MessageID', () => {
                expect(mockCallComposerContactGroupSelection).toHaveBeenCalledTimes(5);
                expect(mockCallComposerContactGroupSelection)
                    .toHaveBeenCalledWith(inputFormat.MessageID);

            });

            it('should try to access to the cache', () => {
                const keys = Object.keys(detailsFormat.MAPS.GROUP_EMAILS);
                expect(mockComposerContactGroupSelection.get).toHaveBeenCalledTimes(3);

                keys.forEach((ID) => {
                    expect(mockComposerContactGroupSelection.get).toHaveBeenCalledWith(ID);
                });
            });

            it('should try to access to the cache for a draft', () => {
                expect(mockComposerContactGroupSelection.getDraftConfig).toHaveBeenCalledTimes(2);
            });

            it('should try to access to the cache for a draft CCList', () => {
                expect(mockComposerContactGroupSelection.getDraftConfig).toHaveBeenCalledWith('CCList');
            });

            it('should try to access to the cache for a draft BCCList', () => {
                expect(mockComposerContactGroupSelection.getDraftConfig).toHaveBeenCalledWith('BCCList');
            });

            it('should export the config for a group', () => {
                const keys = Object.keys(detailsFormat.MAPS.GROUP_EMAILS);
                expect(contactGroupModel.getExport).toHaveBeenCalledTimes(3);

                keys.forEach((ID) => {
                    expect(contactGroupModel.getExport).toHaveBeenCalledWith(ID);
                });
            });


            it('should remove the config for the draft', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledTimes(2);
            });

            it('should remove the config for the draft CCList', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledWith('CCList');
            });

            it('should remove the config for the draft BCCList', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledWith('BCCList');
            });

            it('should save the config by group', () => {
                expect(mockComposerContactGroupSelection.save).toHaveBeenCalledTimes(3);
            });

            it('should format every list', async () => {
                const { ToList, CCList, BCCList } = output;
                expect(ToList.length).toBe(0)
                expect(CCList).toEqual(outputCCFormat);
                expect(BCCList).toEqual(outputBCCFormat);
            })
        });

        describe('Open a draft with no-groups + contacts and user have them too', () => {

            let output;
            const list = inputFormat.list.filter((item) => !item.isContactGroup);
            const [ToList, ...CCList] = list;

            const { toList: outputToFormat, ccList: outputCCFormat } = outputFormat
                .filter((item) => !item.Group)
                .reduce((acc, item) => {
                    if (item.Address === ToList.Address) {
                        acc.toList.push(item);
                        return acc;
                    }
                    acc.ccList.push(item);
                    return acc;
                }, { ccList: [], toList: [] });


            beforeEach(async () => {
                mockCallComposerContactGroupSelection = jasmine.createSpy();
                spyOn(mockComposerContactGroupSelection, 'save');
                spyOn(mockComposerContactGroupSelection, 'removeDraftConfig');
                spyOn(mockComposerContactGroupSelection, 'get');
                spyOn(mockComposerContactGroupSelection, 'getDraftConfig').and.callFake((type) => {
                    if (type === 'ToList') {
                        return detailsFormat.MAPS.draftList;
                    }
                });
                spyOn(contactEmails, 'findEmails').and.callFake((address) => {
                    const id = detailsFormat.MAPS.MOCK_CONTACT_EMAILS[address.toString()];
                    return detailsFormat.MAPS.GROUP_EMAILS[id];
                });

                spyOn(contactGroupModel, 'getExport').and.callFake((ID) => {
                    return detailsFormat.MAPS.GROUP_EMAILS[ID];
                });

                output = await service.format({
                    ID: inputFormat.MessageID,
                    ToList: [ ToList ],
                    CCList
                });
            });

            it('should call the cache scoped by MessageID', () => {
                expect(mockCallComposerContactGroupSelection).toHaveBeenCalledTimes(2);
                expect(mockCallComposerContactGroupSelection)
                    .toHaveBeenCalledWith(inputFormat.MessageID);

            });

            it('should not try to access to the cache', () => {
                expect(mockComposerContactGroupSelection.get).toHaveBeenCalledTimes(0);
            });

            it('should try to access to the cache for a draft', () => {
                expect(mockComposerContactGroupSelection.getDraftConfig).toHaveBeenCalledTimes(2);
            });

            it('should try to access to the cache for a draft ToList', () => {
                expect(mockComposerContactGroupSelection.getDraftConfig).toHaveBeenCalledWith('ToList');
            });

            it('should try to access to the cache for a draft CCList', () => {
                expect(mockComposerContactGroupSelection.getDraftConfig).toHaveBeenCalledWith('CCList');
            });

            it('should not export the config for a group', () => {
                expect(contactGroupModel.getExport).toHaveBeenCalledTimes(0);
            });

            it('should remove the config for the draft', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledTimes(2);
            });

            it('should remove the config for the draft ToList', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledWith('ToList');
            });

            it('should remove the config for the draft CCList', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledWith('CCList');
            });

            it('should not save the config by group', () => {
                expect(mockComposerContactGroupSelection.save).toHaveBeenCalledTimes(0);
            });

            it('should format ToList', async () => {
                const { ToList, CCList, BCCList } = output;
                expect(ToList).toEqual(outputToFormat);
                expect(CCList).toEqual(outputCCFormat);
                expect(BCCList.length).toBe(0)
            })
        });

        describe('Open a draft with groups + contacts and user have them too', () => {

            let output;

            beforeEach(async () => {
                mockCallComposerContactGroupSelection = jasmine.createSpy();
                spyOn(mockComposerContactGroupSelection, 'save');
                spyOn(mockComposerContactGroupSelection, 'removeDraftConfig');
                spyOn(mockComposerContactGroupSelection, 'get');
                spyOn(mockComposerContactGroupSelection, 'getDraftConfig').and.callFake((type) => {
                    if (type === 'ToList') {
                        return detailsFormat.MAPS.draftList;
                    }
                });
                spyOn(contactEmails, 'findEmails').and.callFake((address) => {
                    const id = detailsFormat.MAPS.MOCK_CONTACT_EMAILS[address.toString()];
                    return detailsFormat.MAPS.GROUP_EMAILS[id];
                });

                spyOn(contactGroupModel, 'getExport').and.callFake((ID) => {
                    return detailsFormat.MAPS.GROUP_EMAILS[ID];
                });

                output = await service.format({
                    ID: inputFormat.MessageID,
                    ToList: inputFormat.list
                });
            });


            it('should call the cache scoped by MessageID', () => {
                expect(mockCallComposerContactGroupSelection).toHaveBeenCalledTimes(4);
                expect(mockCallComposerContactGroupSelection)
                    .toHaveBeenCalledWith(inputFormat.MessageID);
            });

            it('should try to access to the cache', () => {
                const keys = Object.keys(detailsFormat.MAPS.GROUP_EMAILS);
                expect(mockComposerContactGroupSelection.get).toHaveBeenCalledTimes(3);

                keys.forEach((ID) => {
                    expect(mockComposerContactGroupSelection.get).toHaveBeenCalledWith(ID);
                });
            });

            it('should remove the config for the draft', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledTimes(1);
            });

            it('should remove the config for the draft ToList', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledWith('ToList');
            });

            it('should export the config for a group', () => {
                const keys = Object.keys(detailsFormat.MAPS.GROUP_EMAILS);
                expect(contactGroupModel.getExport).toHaveBeenCalledTimes(3);

                keys.forEach((ID) => {
                    expect(contactGroupModel.getExport).toHaveBeenCalledWith(ID);
                });
            });

            it('should remove the config for the draft', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledTimes(1);
            });

            it('should remove the config for the draft ToList', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledWith('ToList');
            });

            it('should save the config by group', () => {
                expect(mockComposerContactGroupSelection.save).toHaveBeenCalledTimes(3);
            });

            it('should format ToList', async () => {
                const { ToList, CCList, BCCList } = output;
                expect(ToList).toEqual(outputFormat);
                expect(CCList.length).toBe(0)
                expect(BCCList.length).toBe(0)
            })
        });

        describe('Open a draft with groups + contacts and user does not have them', () => {

            let output;

            const draftList = {...detailsFormat.MAPS.draftList};
            const GROUP_EMAILS = {...detailsFormat.MAPS.GROUP_EMAILS};
            const [key, ...keysTest] = Object.keys(draftList);

            beforeEach(async () => {
                mockCallComposerContactGroupSelection = jasmine.createSpy();
                spyOn(mockComposerContactGroupSelection, 'save');
                spyOn(mockComposerContactGroupSelection, 'removeDraftConfig');
                spyOn(mockComposerContactGroupSelection, 'get');
                spyOn(mockComposerContactGroupSelection, 'getDraftConfig').and.callFake((type) => {
                    if (type === 'ToList') {
                        return draftList;
                    }
                });
                spyOn(contactEmails, 'findEmails').and.callFake((address) => {
                    const id = detailsFormat.MAPS.MOCK_CONTACT_EMAILS[address.toString()];

                    if (key === id) {
                        return [];
                    }
                    return GROUP_EMAILS[id];
                });

                spyOn(contactGroupModel, 'getExport').and.callFake((ID) => {
                    return GROUP_EMAILS[ID] || [];
                });

                output = await service.format({
                    ID: inputFormat.MessageID,
                    ToList: inputFormat.list
                });
            });


            it('should call the cache scoped by MessageID', () => {
                expect(mockCallComposerContactGroupSelection).toHaveBeenCalledTimes(4);
                expect(mockCallComposerContactGroupSelection)
                    .toHaveBeenCalledWith(inputFormat.MessageID);
            });

            it('should try to access to the cache', () => {
                const keys = Object.keys(detailsFormat.MAPS.GROUP_EMAILS);
                expect(mockComposerContactGroupSelection.get).toHaveBeenCalledTimes(3);

                keys.forEach((ID) => {
                    expect(mockComposerContactGroupSelection.get).toHaveBeenCalledWith(ID);
                });
            });

            it('should remove the config for the draft', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledTimes(1);
            });

            it('should remove the config for the draft ToList', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledWith('ToList');
            });

            it('should export the config for a group', () => {
                const keys = Object.keys(detailsFormat.MAPS.GROUP_EMAILS);
                expect(contactGroupModel.getExport).toHaveBeenCalledTimes(3);

                keys.forEach((ID) => {
                    expect(contactGroupModel.getExport).toHaveBeenCalledWith(ID);
                });
            });

            it('should remove the config for the draft', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledTimes(1);
            });

            it('should remove the config for the draft ToList', () => {
                expect(mockComposerContactGroupSelection.removeDraftConfig).toHaveBeenCalledWith('ToList');
            });

            it('should save the config by group', () => {
                expect(mockComposerContactGroupSelection.save).toHaveBeenCalledTimes(3);
            });

            it('should save the config by groups', () => {
                keysTest.concat(key).forEach((ID) => {
                    expect(mockComposerContactGroupSelection.save).toHaveBeenCalledWith({ ID }, jasmine.any(Object));
                })
            });

            it('should format ToList', async () => {
                const { ToList, CCList, BCCList } = output;
                expect(ToList).toEqual(outputFormat);
                expect(CCList.length).toBe(0)
                expect(BCCList.length).toBe(0)
            })
        });
    });

});
