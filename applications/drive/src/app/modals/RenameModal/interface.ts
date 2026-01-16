import type { ProtonDriveClient } from '@proton/drive';

/**
 * Drive client required by the rename modal component.
 *
 * To show the rename modal, getNode is required to get metadata,
 * and renameNode is required to perform the rename operation.
 */
export type Drive = Pick<ProtonDriveClient, 'getNode' | 'renameNode'>;
