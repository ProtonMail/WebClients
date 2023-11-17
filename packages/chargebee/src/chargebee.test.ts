import { ChargebeeInstanceConfiguration } from '../lib';
import { createChargebee, getChargebeeInstance, resetChargebee } from './chargebee';

beforeEach(() => {
    (global as any).Chargebee = {
        init: jest.fn().mockReturnValue({
            chargebeeMock: true,
        }),
    };

    resetChargebee();
});

it('should create instance', () => {
    const config: ChargebeeInstanceConfiguration = {
        publishableKey: 'pk_test_123',
        site: 'test-site',
        domain: 'proton.me',
    };
    const result = createChargebee(config);
    expect(result).toEqual({ chargebeeMock: true });
    expect((global as any).Chargebee.init).toHaveBeenCalledWith(config);
});

it('should save instance', () => {
    const config: ChargebeeInstanceConfiguration = {
        publishableKey: 'pk_test_123',
        site: 'test-site',
        domain: 'proton.me',
    };
    const result = createChargebee(config);

    expect(getChargebeeInstance()).toEqual(result);
    expect(getChargebeeInstance()).toEqual({
        chargebeeMock: true,
    });
});

it('should throw error if not initialized', () => {
    expect(() => getChargebeeInstance()).toThrow();
});
