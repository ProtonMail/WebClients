import { c } from 'ttag';

import type { MaybeNode } from '@proton/drive';
import { MemberRole } from '@proton/drive';

export const DEVICES_ROOT_ID = 'devices-root';
export const SHARED_WITH_ME_ROOT_ID = 'shared-with-me-root';

const PERMISSION_VALUES = {
    [MemberRole.Inherited]: 0,
    [MemberRole.Viewer]: 1,
    [MemberRole.Editor]: 2,
    [MemberRole.Admin]: 3,
};

export function getMorePermissiveRole(first: MemberRole, second: MemberRole) {
    if (PERMISSION_VALUES[first] > PERMISSION_VALUES[second]) {
        return first;
    } else {
        return second;
    }
}

export function getName(node: MaybeNode) {
    const { name } = node.ok ? node.value : node.error;
    if (typeof name === 'string') {
        return name;
    } else {
        if (name.ok) {
            return name.value;
        } else {
            return c('Label').t`Encrypted node`;
        }
    }
}

export function makeTreeItemId(parentUid: string | null, uid: string) {
    return `${parentUid}___${uid}`;
}

export function getNodeUidFromTreeItemId(treeItemId: string) {
    return treeItemId.split('___').at(-1);
}
