import factory from '../../../../src/app/contact/services/contactEncryptionSettings';

const mockService = {
    test: () => ({})
};

describe('[contact/services] ~ contactEncryptionSettings', () => {
    let service;

    beforeEach(() => {
        spyOn(mockService, 'test').and.callThrough();
        service = factory(mockService);
    });
});
