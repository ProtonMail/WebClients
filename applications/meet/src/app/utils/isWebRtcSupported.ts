export const isWebRtcSupported = () => {
    if (typeof RTCPeerConnection === 'undefined') {
        return false;
    }
    return 'addTransceiver' in RTCPeerConnection.prototype || 'addTrack' in RTCPeerConnection.prototype;
};
