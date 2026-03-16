import { getParticipantDisplayColorsByIndex } from './getParticipantDisplayColorsByIndex';

function stableColorIndex(identity: string): number {
    let hash = 0;
    for (let i = 0; i < identity.length; i++) {
        hash = ((hash << 5) - hash + identity.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 6;
}
export const getParticipantDisplayColorsByIdentity = (identity: string | undefined) => {
    if (!identity) {
        return getParticipantDisplayColorsByIndex(0);
    }

    const index = stableColorIndex(identity);

    return getParticipantDisplayColorsByIndex(index);
};
