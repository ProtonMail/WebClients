interface ShouldShowParticipantVideoParams {
    /** The camera publication exists and its track is not muted. */
    cameraIsOn: boolean;
    isLocalParticipant: boolean;
    /** Whether the local self-view should be suppressed even though the camera track is live. */
    isLocalVideoSuppressed: boolean;
    /** Whether video is disabled for this participant (global disableVideos or per-participant). */
    isVideoDisabled: boolean;
}

export const shouldShowParticipantVideo = ({
    cameraIsOn,
    isLocalParticipant,
    isLocalVideoSuppressed,
    isVideoDisabled,
}: ShouldShowParticipantVideoParams): boolean =>
    cameraIsOn && !(isLocalParticipant && isLocalVideoSuppressed) && (!isVideoDisabled || isLocalParticipant);
