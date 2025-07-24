import { useEffect, useMemo, useRef, useState } from 'react';

import {
    type AddressKeysMetadataResult,
    type UserKeysMetadataResult,
    getAddressKeysMetadata,
    getUserKeysMetadata,
} from '@proton/account/addressKeys/getKeyMetadata';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { Address, DecryptedAddressKey, DecryptedKey, UserModel } from '@proton/shared/lib/interfaces';

import { getDisplayKey } from './getDisplayKey';

interface Props {
    user: UserModel;
    userKeys?: DecryptedKey[];
    address?: Address;
    addressKeys?: DecryptedAddressKey[];
    loadingKeyID?: string;
}

const defaultValue: {
    user: UserKeysMetadataResult;
    address: AddressKeysMetadataResult;
} = {
    user: {
        userKeyMetadataList: [],
        existingAlgorithms: [],
    },
    address: {
        addressKeyMetadataList: [],
        signedKeyListMap: {},
        existsPrimaryKeyV6: false,
        existingAlgorithms: [],
    },
};

export const useKeysMetadata = ({ user, userKeys, address, addressKeys, loadingKeyID }: Props) => {
    const [state, setState] = useState(defaultValue);
    const ref = useRef(0);
    const dispatch = useDispatch();

    useEffect(() => {
        const run = () => {
            return Promise.all([
                userKeys
                    ? dispatch(
                          getUserKeysMetadata({
                              user,
                              userKeys,
                          })
                      )
                    : undefined,
                address && addressKeys
                    ? dispatch(
                          getAddressKeysMetadata({
                              address,
                              addressKeys,
                          })
                      )
                    : undefined,
            ]);
        };
        const current = ++ref.current;
        run()
            .then(([user, address]) => {
                if (current === ref.current) {
                    setState({
                        user: user ?? defaultValue.user,
                        address: address ?? defaultValue.address,
                    });
                }
            })
            .catch(() => {
                if (current === ref.current) {
                    setState(defaultValue);
                }
            });
    }, [userKeys, addressKeys]);

    return useMemo(() => {
        const userSignedKeyListMap = {};
        return {
            user: {
                ...state.user,
                displayKeys: state.user.userKeyMetadataList.map((data) => {
                    return getDisplayKey({
                        user,
                        address,
                        isLoading: loadingKeyID === data.Key.ID,
                        signedKeyListMap: userSignedKeyListMap,
                        existsPrimaryKeyV6: false,
                        ...data,
                    });
                }),
            },
            address: {
                ...state.address,
                displayKeys: state.address.addressKeyMetadataList.map((data) => {
                    return getDisplayKey({
                        user,
                        address,
                        isLoading: loadingKeyID === data.Key.ID,
                        signedKeyListMap: state.address.signedKeyListMap,
                        existsPrimaryKeyV6: state.address.existsPrimaryKeyV6,
                        ...data,
                    });
                }),
            },
        };
    }, [user, address, state, loadingKeyID]);
};
