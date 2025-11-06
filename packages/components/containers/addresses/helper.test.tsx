import {
    canReceive,
    canSend,
    getPermission,
    getReceivePermission,
    getSendPermission,
    hasIncompleteSetup,
    noPermissionMap,
    permissionsMap,
    permissionsReceiveMap,
    permissionsSendMap,
    setupIncompletePermissionMap,
} from '@proton/components/containers/addresses/helper';
import { ADDRESS_PERMISSIONS, ADDRESS_PERMISSION_TYPE } from '@proton/shared/lib/constants';

describe('addresses helper functions', () => {
    describe('canReceive', () => {
        it('Should return true for any receive permission', () => {
            expect(
                canReceive(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL | ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL)
            ).toBeTruthy();
            expect(
                canReceive(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG | ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL)
            ).toBeTruthy();
            expect(
                canReceive(
                    ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL |
                        ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG |
                        ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL
                )
            ).toBeTruthy();
        });
        it('Should return false if no receive permission', () => {
            expect(canReceive(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL)).toBeFalsy();
            expect(canReceive(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG)).toBeFalsy();
            expect(
                canReceive(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL | ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG)
            ).toBeFalsy();
        });
    });

    describe('canSend', () => {
        it('Should return true for any send permission', () => {
            expect(
                canSend(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL | ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL)
            ).toBeTruthy();
            expect(
                canSend(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG | ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL)
            ).toBeTruthy();
            expect(
                canSend(
                    ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL |
                        ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG |
                        ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL
                )
            ).toBeTruthy();
        });
        it('Should return false if no send permission', () => {
            expect(canSend(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL)).toBeFalsy();
            expect(canSend(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG)).toBeFalsy();
            expect(
                canSend(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL | ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG)
            ).toBeFalsy();
        });
    });

    describe('hasIncompleteSetup', () => {
        it('Should return true when no receive and send permission both', () => {
            expect(hasIncompleteSetup(ADDRESS_PERMISSIONS.PERMISSIONS_AUTORESPONDER)).toBeTruthy();
            expect(hasIncompleteSetup(ADDRESS_PERMISSIONS.NO_PERMISSION)).toBeTruthy();
        });
        it('Should return false when at least one of the receive or send permission set', () => {
            expect(hasIncompleteSetup(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL)).toBeFalsy();
            expect(hasIncompleteSetup(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG)).toBeFalsy();
            expect(hasIncompleteSetup(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL)).toBeFalsy();
            expect(hasIncompleteSetup(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG)).toBeFalsy();
        });
    });

    describe('noPermissionMap', () => {
        it('Should return one no permission option', () => {
            const options = noPermissionMap();
            expect(options).toHaveLength(1);
            expect(options[0].text).toEqual('No permission');
            expect(options[0].value).toEqual(ADDRESS_PERMISSIONS.NO_PERMISSION);
        });
    });

    describe('setupIncompletePermissionMap', () => {
        it('Should return one setup incomplete option', () => {
            const options = setupIncompletePermissionMap();
            expect(options).toHaveLength(1);
            expect(options[0].text).toEqual('Setup incomplete');
            expect(options[0].value).toEqual(ADDRESS_PERMISSIONS.NO_PERMISSION);
        });
    });

    describe('permissionsReceiveMap', () => {
        it('Should return two receive permission options', () => {
            const options = permissionsReceiveMap();
            expect(options).toHaveLength(2);
            expect(options[0].text).toEqual('Receive from all');
            expect(options[0].value).toEqual(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL);
            expect(options[1].text).toEqual('Organization only');
            expect(options[1].value).toEqual(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG);
        });
    });

    describe('permissionsSendMap', () => {
        it('Should return two send permission options', () => {
            const options = permissionsSendMap();
            expect(options).toHaveLength(2);
            expect(options[0].text).toEqual('Send to all');
            expect(options[0].value).toEqual(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL);
            expect(options[1].text).toEqual('Organization only');
            expect(options[1].value).toEqual(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG);
        });
    });

    describe('getReceivePermission', () => {
        it('Should return ALL permission in priority', () => {
            expect(getReceivePermission(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL)).toEqual(
                ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL
            );
            expect(
                getReceivePermission(
                    ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL | ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG
                )
            ).toEqual(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL);
            expect(
                getReceivePermission(
                    ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL |
                        ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG |
                        ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL
                )
            ).toEqual(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL);
        });
        it('Should return ORG permission', () => {
            expect(getReceivePermission(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG)).toEqual(
                ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG
            );
            expect(
                getReceivePermission(
                    ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG | ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL
                )
            ).toEqual(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG);
        });
        it('Should default to no permission', () => {
            expect(getReceivePermission(ADDRESS_PERMISSIONS.NO_PERMISSION)).toEqual(ADDRESS_PERMISSIONS.NO_PERMISSION);
            expect(getReceivePermission(ADDRESS_PERMISSIONS.PERMISSIONS_AUTORESPONDER)).toEqual(
                ADDRESS_PERMISSIONS.NO_PERMISSION
            );
            expect(getReceivePermission(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL)).toEqual(
                ADDRESS_PERMISSIONS.NO_PERMISSION
            );
        });
    });

    describe('getSendPermission', () => {
        it('Should return ALL permission in priority', () => {
            expect(getSendPermission(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL)).toEqual(
                ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL
            );
            expect(
                getSendPermission(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL | ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG)
            ).toEqual(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL);
            expect(
                getSendPermission(
                    ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL |
                        ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG |
                        ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL
                )
            ).toEqual(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL);
        });
        it('Should return ORG permission', () => {
            expect(getSendPermission(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG)).toEqual(
                ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG
            );
            expect(
                getSendPermission(
                    ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG | ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL
                )
            ).toEqual(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG);
        });
        it('Should default to no permission', () => {
            expect(getSendPermission(ADDRESS_PERMISSIONS.NO_PERMISSION)).toEqual(ADDRESS_PERMISSIONS.NO_PERMISSION);
            expect(getSendPermission(ADDRESS_PERMISSIONS.PERMISSIONS_AUTORESPONDER)).toEqual(
                ADDRESS_PERMISSIONS.NO_PERMISSION
            );
            expect(getSendPermission(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL)).toEqual(
                ADDRESS_PERMISSIONS.NO_PERMISSION
            );
        });
    });

    describe('permissionsMap', () => {
        it('Should return two receive permission options', () => {
            const options = permissionsMap(
                ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL,
                ADDRESS_PERMISSION_TYPE.RECEIVE
            );
            expect(options).toHaveLength(2);
            expect(options[0].text).toEqual('Receive from all');
            expect(options[0].value).toEqual(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL);
            expect(options[1].text).toEqual('Organization only');
            expect(options[1].value).toEqual(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG);
        });
        it('Should return no receive permission option', () => {
            const options = permissionsMap(
                ADDRESS_PERMISSIONS.PERMISSIONS_AUTORESPONDER | ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL,
                ADDRESS_PERMISSION_TYPE.RECEIVE
            );
            expect(options).toHaveLength(1);
            expect(options[0].text).toEqual('No permission');
            expect(options[0].value).toEqual(ADDRESS_PERMISSIONS.NO_PERMISSION);
        });
        it('Should return setup incomplete option', () => {
            const options = permissionsMap(
                ADDRESS_PERMISSIONS.PERMISSIONS_AUTORESPONDER,
                ADDRESS_PERMISSION_TYPE.RECEIVE
            );
            expect(options).toHaveLength(1);
            expect(options[0].text).toEqual('Setup incomplete');
            expect(options[0].value).toEqual(ADDRESS_PERMISSIONS.NO_PERMISSION);
        });
        it('Should return two send permission options', () => {
            const options = permissionsMap(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL, ADDRESS_PERMISSION_TYPE.SEND);
            expect(options).toHaveLength(2);
            expect(options[0].text).toEqual('Send to all');
            expect(options[0].value).toEqual(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL);
            expect(options[1].text).toEqual('Organization only');
            expect(options[1].value).toEqual(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG);
        });
        it('Should return no send permission option', () => {
            const options = permissionsMap(
                ADDRESS_PERMISSIONS.PERMISSIONS_AUTORESPONDER | ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL,
                ADDRESS_PERMISSION_TYPE.SEND
            );
            expect(options).toHaveLength(1);
            expect(options[0].text).toEqual('No permission');
            expect(options[0].value).toEqual(ADDRESS_PERMISSIONS.NO_PERMISSION);
        });
        it('Should return setup incomplete option', () => {
            const options = permissionsMap(ADDRESS_PERMISSIONS.PERMISSIONS_AUTORESPONDER, ADDRESS_PERMISSION_TYPE.SEND);
            expect(options).toHaveLength(1);
            expect(options[0].text).toEqual('Setup incomplete');
            expect(options[0].value).toEqual(ADDRESS_PERMISSIONS.NO_PERMISSION);
        });
    });

    describe('getPermission', () => {
        it('Should return receive all permission in priority', () => {
            expect(getPermission(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL, ADDRESS_PERMISSION_TYPE.RECEIVE)).toEqual(
                'Receive from all'
            );
            expect(
                getPermission(
                    ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL | ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG,
                    ADDRESS_PERMISSION_TYPE.RECEIVE
                )
            ).toEqual('Receive from all');
            expect(
                getPermission(
                    ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL |
                        ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG |
                        ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL,
                    ADDRESS_PERMISSION_TYPE.RECEIVE
                )
            ).toEqual('Receive from all');
        });
        it('Should return receive org permission', () => {
            expect(getPermission(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG, ADDRESS_PERMISSION_TYPE.RECEIVE)).toEqual(
                'Organization only'
            );
            expect(
                getPermission(
                    ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG | ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL,
                    ADDRESS_PERMISSION_TYPE.RECEIVE
                )
            ).toEqual('Organization only');
        });
        it('Should return receive setup incomplete', () => {
            expect(getPermission(ADDRESS_PERMISSIONS.NO_PERMISSION, ADDRESS_PERMISSION_TYPE.RECEIVE)).toEqual(
                'Setup incomplete'
            );
            expect(
                getPermission(ADDRESS_PERMISSIONS.PERMISSIONS_AUTORESPONDER, ADDRESS_PERMISSION_TYPE.RECEIVE)
            ).toEqual('Setup incomplete');
        });
        it('Should default to receive no permission', () => {
            expect(getPermission(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL, ADDRESS_PERMISSION_TYPE.RECEIVE)).toEqual(
                'No permission'
            );
            expect(
                getPermission(
                    ADDRESS_PERMISSIONS.PERMISSIONS_AUTORESPONDER | ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL,
                    ADDRESS_PERMISSION_TYPE.RECEIVE
                )
            ).toEqual('No permission');
        });
        it('Should return send all permission in priority', () => {
            expect(getPermission(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL, ADDRESS_PERMISSION_TYPE.SEND)).toEqual(
                'Send to all'
            );
            expect(
                getPermission(
                    ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL | ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG,
                    ADDRESS_PERMISSION_TYPE.SEND
                )
            ).toEqual('Send to all');
            expect(
                getPermission(
                    ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL |
                        ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG |
                        ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL,
                    ADDRESS_PERMISSION_TYPE.SEND
                )
            ).toEqual('Send to all');
        });
        it('Should return send org permission', () => {
            expect(getPermission(ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG, ADDRESS_PERMISSION_TYPE.SEND)).toEqual(
                'Organization only'
            );
            expect(
                getPermission(
                    ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG | ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL,
                    ADDRESS_PERMISSION_TYPE.SEND
                )
            ).toEqual('Organization only');
        });
        it('Should return send setup incomplete', () => {
            expect(getPermission(ADDRESS_PERMISSIONS.NO_PERMISSION, ADDRESS_PERMISSION_TYPE.SEND)).toEqual(
                'Setup incomplete'
            );
            expect(getPermission(ADDRESS_PERMISSIONS.PERMISSIONS_AUTORESPONDER, ADDRESS_PERMISSION_TYPE.SEND)).toEqual(
                'Setup incomplete'
            );
        });
        it('Should default to send no permission', () => {
            expect(getPermission(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL, ADDRESS_PERMISSION_TYPE.SEND)).toEqual(
                'No permission'
            );
            expect(getPermission(ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL, ADDRESS_PERMISSION_TYPE.SEND)).toEqual(
                'No permission'
            );
            expect(
                getPermission(
                    ADDRESS_PERMISSIONS.PERMISSIONS_AUTORESPONDER | ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL,
                    ADDRESS_PERMISSION_TYPE.SEND
                )
            ).toEqual('No permission');
        });
    });
});
