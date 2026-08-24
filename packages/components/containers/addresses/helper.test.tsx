import {
    ADDRESS_FLAGS,
    ADDRESS_PERMISSIONS,
    ADDRESS_PERMISSION_TYPE,
    ADDRESS_STATUS,
    ADDRESS_TYPE,
    MEMBER_ROLE,
    MEMBER_TYPE,
} from '@proton/shared/lib/constants';
import type { Address, Member, PartialMemberAddress, UserModel } from '@proton/shared/lib/interfaces';

import {
    canReceive,
    canSend,
    getPermission,
    getPermissions,
    getReceivePermission,
    getSendPermission,
    hasIncompleteSetup,
    noPermissionMap,
    permissionsMap,
    permissionsReceiveMap,
    permissionsSendMap,
    setupIncompletePermissionMap,
} from './helper';

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

    describe('getPermissions', () => {
        const adminUser = { isAdmin: true, canPay: true, Private: 1 } as UserModel;

        const selfMember = { Self: 1, Type: MEMBER_TYPE.PROTON } as Member;
        const otherMember = { Self: 0, Type: MEMBER_TYPE.PROTON } as Member;

        const buildAddress = (address: Partial<Address> = {}): Address => {
            return {
                ID: 'address-1',
                Email: 'test@gmail.com',
                Type: ADDRESS_TYPE.TYPE_EXTERNAL,
                Status: ADDRESS_STATUS.STATUS_ENABLED,
                Priority: 2,
                Flags: ADDRESS_FLAGS.BYOE,
                HasKeys: 1,
                ...address,
            } as Address;
        };

        const getBYOEPermissions = ({
            address = buildAddress(),
            member,
            isPrimaryAdmin = false,
            addresses,
            user = adminUser,
        }: {
            address?: Address;
            member?: Member;
            isPrimaryAdmin?: boolean;
            addresses?: PartialMemberAddress[];
            user?: UserModel;
        }) => {
            return getPermissions({
                addressIndex: 1,
                member,
                address,
                addresses: addresses ?? ([address] as PartialMemberAddress[]),
                user,
                isPrimaryAdmin,
            });
        };

        describe('BYOE actions are restricted to the address owner', () => {
            it('should allow the owner to grant permissions and disconnect their own connected BYOE address', () => {
                const permissions = getBYOEPermissions({ member: selfMember });

                expect(permissions.canGrantBYOEPermissions).toBe(true);
                expect(permissions.canDisconnectBYOE).toBe(true);
                expect(permissions.canReconnectBYOE).toBe(false);
            });

            it('should allow the owner to reconnect their own disconnected BYOE address', () => {
                const disconnectedAddress = buildAddress({
                    Flags:
                        ADDRESS_FLAGS.BYOE |
                        ADDRESS_FLAGS.FLAG_DISABLE_E2EE |
                        ADDRESS_FLAGS.FLAG_DISABLE_EXPECTED_SIGNED,
                });

                const permissions = getBYOEPermissions({ address: disconnectedAddress, member: selfMember });

                expect(permissions.canReconnectBYOE).toBe(true);
                expect(permissions.canGrantBYOEPermissions).toBe(false);
                expect(permissions.canDisconnectBYOE).toBe(false);
            });

            it('should not let an admin grant, reconnect or disconnect a member BYOE address', () => {
                const permissions = getBYOEPermissions({ member: otherMember });

                expect(permissions.canGrantBYOEPermissions).toBe(false);
                expect(permissions.canReconnectBYOE).toBe(false);
                expect(permissions.canDisconnectBYOE).toBe(false);
            });

            it('should not let an admin reconnect a disconnected member BYOE address', () => {
                const disconnectedAddress = buildAddress({
                    Flags:
                        ADDRESS_FLAGS.BYOE |
                        ADDRESS_FLAGS.FLAG_DISABLE_E2EE |
                        ADDRESS_FLAGS.FLAG_DISABLE_EXPECTED_SIGNED,
                });

                const permissions = getBYOEPermissions({ address: disconnectedAddress, member: otherMember });

                expect(permissions.canReconnectBYOE).toBe(false);
            });

            it('should not allow disconnecting a disabled BYOE address', () => {
                const disabledAddress = buildAddress({ Status: ADDRESS_STATUS.STATUS_DISABLED });

                const permissions = getBYOEPermissions({ address: disabledAddress, member: selfMember });

                expect(permissions.canDisconnectBYOE).toBe(false);
            });
        });

        describe('admin managing a member BYOE address on a multi-user personal plan', () => {
            it('should allow disabling an enabled member BYOE address', () => {
                const permissions = getBYOEPermissions({ member: otherMember });

                expect(permissions.canDisable).toBe(true);
                expect(permissions.canEnable).toBe(false);
            });

            it('should allow enabling a disabled member BYOE address', () => {
                const disabledAddress = buildAddress({ Status: ADDRESS_STATUS.STATUS_DISABLED });

                const permissions = getBYOEPermissions({ address: disabledAddress, member: otherMember });

                expect(permissions.canEnable).toBe(true);
                expect(permissions.canDisable).toBe(false);
            });

            it('should not let an ordinary admin disable or enable another admin BYOE address', () => {
                const adminMember = {
                    Self: 0,
                    Type: MEMBER_TYPE.PROTON,
                    Role: MEMBER_ROLE.ORGANIZATION_ADMIN,
                } as Member;

                const enabledPermissions = getBYOEPermissions({ member: adminMember });
                const disabledPermissions = getBYOEPermissions({
                    address: buildAddress({ Status: ADDRESS_STATUS.STATUS_DISABLED }),
                    member: adminMember,
                });

                expect(enabledPermissions.canDisable).toBe(false);
                expect(disabledPermissions.canEnable).toBe(false);
            });

            it('should let the primary admin disable and enable another admin BYOE address', () => {
                const adminMember = {
                    Self: 0,
                    Type: MEMBER_TYPE.PROTON,
                    Role: MEMBER_ROLE.ORGANIZATION_ADMIN,
                } as Member;

                const enabledPermissions = getBYOEPermissions({ member: adminMember, isPrimaryAdmin: true });
                const disabledPermissions = getBYOEPermissions({
                    address: buildAddress({ Status: ADDRESS_STATUS.STATUS_DISABLED }),
                    member: adminMember,
                    isPrimaryAdmin: true,
                });

                expect(enabledPermissions.canDisable).toBe(true);
                expect(disabledPermissions.canEnable).toBe(true);
            });

            it('should only offer disconnect, never disable, on your own BYOE address', () => {
                const memberUser = { isAdmin: false, canPay: false, Private: 1 } as UserModel;

                const memberPermissions = getBYOEPermissions({ member: selfMember, user: memberUser });
                const adminPermissions = getBYOEPermissions({ member: selfMember });
                const primaryAdminPermissions = getBYOEPermissions({ member: selfMember, isPrimaryAdmin: true });

                expect(memberPermissions.canDisable).toBe(false);
                expect(memberPermissions.canDisconnectBYOE).toBe(true);
                expect(adminPermissions.canDisable).toBe(false);
                expect(adminPermissions.canDisconnectBYOE).toBe(true);
                expect(primaryAdminPermissions.canDisable).toBe(false);
                expect(primaryAdminPermissions.canDisconnectBYOE).toBe(true);
            });

            it('should not extend the BYOE exception to non-BYOE external addresses', () => {
                const externalAddress = buildAddress({ Flags: undefined });

                const permissions = getBYOEPermissions({ address: externalAddress, member: otherMember });

                expect(permissions.canDisable).toBe(false);
                expect(permissions.canEnable).toBe(false);
            });
        });

        describe('managed member constraints', () => {
            it('should not allow disabling a member BYOE address that is their only enabled address', () => {
                const address = buildAddress();
                const managedSelfMember = { Self: 1, Type: MEMBER_TYPE.MANAGED } as Member;

                const permissions = getBYOEPermissions({
                    address,
                    member: managedSelfMember,
                    addresses: [address] as PartialMemberAddress[],
                });

                expect(permissions.canDisable).toBe(false);
            });

            it('should not allow disabling a member BYOE address that is their default address', () => {
                const address = buildAddress({ Priority: 1 });
                const managedMember = { Self: 0, Type: MEMBER_TYPE.MANAGED } as Member;
                const otherEnabledAddress = {
                    ID: 'address-2',
                    Status: ADDRESS_STATUS.STATUS_ENABLED,
                } as PartialMemberAddress;

                const permissions = getBYOEPermissions({
                    address,
                    member: managedMember,
                    addresses: [address as PartialMemberAddress, otherEnabledAddress],
                });

                expect(permissions.canDisable).toBe(false);
            });
        });
    });
});
