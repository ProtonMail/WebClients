import service from '../../../../src/app/message/factories/plusAliasModel';


describe('plus alias model', () => {
    let instance;

    beforeEach(() => {
        const addressesModelMock = {
            getByEmail(Email) {
                return {
                    Email,
                    Send: 1,
                    Receive: 1,
                    Status: 1
                };
            }
        };
        instance = service(addressesModelMock);
    });

    it('should not add plus if not needed', () => {
        expect(instance.getAddress('vio@pm.me'))
            .toBeUndefined();
    });

    it('should remove empty plus', () => {
        expect(instance.getAddress('vio+@pm.me'))
            .toEqual(jasmine.objectContaining({
                Email: 'vio@pm.me'
            }));
    });

    it('should add plus once', () => {
        expect(instance.getAddress('vio+test@pm.me'))
            .toEqual(jasmine.objectContaining({
                Email: 'vio+test@pm.me'
            }));
    });
});
