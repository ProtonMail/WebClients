import type { Asset, AssetId } from '../../types';

// Temporary storage for assets with full data before they're persisted to IndexedDB
// This avoids storing non-serializable Uint8Array in Redux actions
const pendingAssetsMap = new Map<AssetId, Asset>();

export const storePendingAsset = (asset: Asset): void => {
    pendingAssetsMap.set(asset.id, asset);
};

export const getPendingAsset = (assetId: AssetId): Asset | undefined => {
    return pendingAssetsMap.get(assetId);
};

export const removePendingAsset = (assetId: AssetId): void => {
    pendingAssetsMap.delete(assetId);
};

export const clearPendingAssets = (): void => {
    pendingAssetsMap.clear();
};

