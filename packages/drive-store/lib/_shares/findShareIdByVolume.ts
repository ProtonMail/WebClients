import { Share, ShareWithKey } from '../../store/_shares/interface';

export function findShareIdByVolume(shares: (Share | ShareWithKey)[], volumeId: string) {
    const share = shares.find((share) => share.volumeId === volumeId && !share.isLocked && !share.isVolumeSoftDeleted);
    return share ? share.shareId : undefined;
}
