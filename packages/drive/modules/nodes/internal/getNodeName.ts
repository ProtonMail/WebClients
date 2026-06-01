import type { Device, MaybeBookmark, MaybeNode } from '@protontech/drive-sdk';
import { c } from 'ttag';

export function getNodeNameFallback() {
    return c('Error').t`⚠️ Undecryptable name`;
}

export function getNodeName(node: MaybeNode): string {
    if (node.ok) {
        return node.value.name;
    }
    const maybeName = node.error.name;
    if (maybeName.ok) {
        return maybeName.value;
    }
    if (maybeName.error instanceof Error || !maybeName.error.name) {
        return getNodeNameFallback();
    }
    // Invalid name can still be used to display the node.
    return maybeName.error.name;
}

export function getBookmarkNodeName(bookmark: MaybeBookmark): string {
    if (bookmark.ok) {
        return bookmark.value.node.name;
    }
    const maybeName = bookmark.error.node.name;
    if (maybeName.ok) {
        return maybeName.value;
    }
    if (maybeName.error instanceof Error) {
        return getNodeNameFallback();
    }
    // Invalid name can still be used to display the node.
    return maybeName.error.name;
}

export function getDeviceName(device: Device) {
    if (device.name.ok) {
        return device.name.value;
    }
    if (device.name.error instanceof Error) {
        return c('Error').t`⚠️ Undecryptable device`;
    }
    return device.name.error.name;
}
