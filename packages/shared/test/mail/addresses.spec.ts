import { ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS, ADDRESS_TYPE } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';
import {
    getAddressFromPlusAlias,
    getByEmail,
    getIsNonDefault,
    getSupportedPlusAlias,
    sortAddresses,
    splitExternalAddresses,
} from '@proton/shared/lib/mail/addresses';

const emailAddress1 = 'email1@proton.me';
const emailDisabled = 'disabled@proton.me';
const emailExternal = 'external@proton.me';
const emailNoReceive = 'noReceive@proton.me';
const emailNoSend = 'noSend@proton.me';

const address1 = {
    Email: emailAddress1,
    Type: ADDRESS_TYPE.TYPE_ORIGINAL,
    Status: ADDRESS_STATUS.STATUS_ENABLED,
    Receive: ADDRESS_RECEIVE.RECEIVE_YES,
    Send: ADDRESS_SEND.SEND_YES,
} as Address;

const disabledAddress = {
    Email: emailDisabled,
    Type: ADDRESS_TYPE.TYPE_ORIGINAL,
    Status: ADDRESS_STATUS.STATUS_DISABLED,
    Receive: ADDRESS_RECEIVE.RECEIVE_YES,
    Send: ADDRESS_SEND.SEND_YES,
} as Address;

const externalAddress = {
    Email: emailExternal,
    Type: ADDRESS_TYPE.TYPE_EXTERNAL,
    Status: ADDRESS_STATUS.STATUS_ENABLED,
    Receive: ADDRESS_RECEIVE.RECEIVE_YES,
    Send: ADDRESS_SEND.SEND_YES,
} as Address;

const noReceiveAddress = {
    Email: emailNoReceive,
    Type: ADDRESS_TYPE.TYPE_ORIGINAL,
    Status: ADDRESS_STATUS.STATUS_ENABLED,
    Receive: ADDRESS_RECEIVE.RECEIVE_NO,
    Send: ADDRESS_SEND.SEND_YES,
} as Address;

const noSendAddress = {
    Email: emailNoSend,
    Type: ADDRESS_TYPE.TYPE_ORIGINAL,
    Status: ADDRESS_STATUS.STATUS_ENABLED,
    Receive: ADDRESS_RECEIVE.RECEIVE_YES,
    Send: ADDRESS_SEND.SEND_NO,
} as Address;

const addresses = [address1, disabledAddress, externalAddress, noReceiveAddress, noSendAddress];

describe('addresses helpers', () => {
    describe('getByEmail', () => {
        it('should return the matching address from an email', () => {
            expect(getByEmail(addresses, emailAddress1)).toEqual(address1);
            expect(getByEmail(addresses, 'email1+alias@proton.me')).toEqual(address1);
            expect(getByEmail(addresses, 'EMAIL1+alias@proton.me')).toEqual(address1);
        });

        it('should return undefined when no matching address is found', () => {
            expect(getByEmail(addresses, 'notMatchingAddress@proton.me')).toBeUndefined();
        });
    });

    describe('getAddressFromPlusAlias', () => {
        it('should return undefined if no +', () => {
            expect(getAddressFromPlusAlias(addresses, emailAddress1)).toBeUndefined();
        });

        it('should return undefined if no @', () => {
            expect(getAddressFromPlusAlias(addresses, 'address1+alias')).toBeUndefined();
        });

        it('should return undefined if address is disabled', () => {
            expect(getAddressFromPlusAlias(addresses, 'disabled+alias@proton.me')).toBeUndefined();
        });

        it('should return undefined if address cannot receive', () => {
            expect(getAddressFromPlusAlias(addresses, 'noReceive+alias@proton.me')).toBeUndefined();
        });

        it('should return undefined if address cannot send', () => {
            expect(getAddressFromPlusAlias(addresses, 'noSend+alias@proton.me')).toBeUndefined();
        });

        it('should return the updated address', () => {
            const emailAlias = 'email1+alias@proton.me';
            expect(getAddressFromPlusAlias(addresses, emailAlias)).toEqual({ ...address1, Email: emailAlias });
        });
    });

    describe('getSupportedPlusAlias', () => {
        it('should return selfAddressEmail if no +', () => {
            expect(
                getSupportedPlusAlias({ selfAttendeeEmail: 'email1@proton.me', selfAddressEmail: 'email1@proton.me' })
            ).toEqual('email1@proton.me');
        });

        it('should return the plus alias', () => {
            expect(
                getSupportedPlusAlias({
                    selfAttendeeEmail: 'email1+alias@proton.me',
                    selfAddressEmail: 'email1@proton.me',
                })
            ).toEqual('email1+alias@proton.me');
        });
    });

    describe('getIsNonDefault', () => {
        it('should be a non default address', () => {
            expect(getIsNonDefault(disabledAddress)).toBeTrue();
            expect(getIsNonDefault(externalAddress)).toBeTrue();
            expect(getIsNonDefault(noReceiveAddress)).toBeTrue();
            expect(getIsNonDefault(noSendAddress)).toBeTrue();
        });

        it('should be a default address', () => {
            expect(getIsNonDefault(address1)).toBeFalse();
        });
    });

    describe('sortAddresses', () => {
        it('should sort addresses as expected', () => {
            expect(sortAddresses(addresses)).toEqual(addresses);
            expect(
                sortAddresses([disabledAddress, address1, externalAddress, noReceiveAddress, noSendAddress])
            ).toEqual(addresses);
        });
    });

    describe('splitExternalAddresses', () => {
        it('should split external addresses', () => {
            const expectedOtherAddresses = [address1, disabledAddress, noReceiveAddress, noSendAddress];
            const expectedExternalAddresses = [externalAddress];
            expect(splitExternalAddresses(addresses)).toEqual({
                otherAddresses: expectedOtherAddresses,
                externalAddresses: expectedExternalAddresses,
            });
        });
    });
});
