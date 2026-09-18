export enum DriveDocsPublicShareMessageType {
    CUSTOM_PASSWORD = 'CUSTOM_PASSWORD',
    READY_TO_RECEIVE_CUSTOM_PASSWORD = 'READY_TO_RECEIVE_CUSTOM_PASSWORD',
}

export type DriveDocsPublicShareMessage =
    | {
          type: DriveDocsPublicShareMessageType.CUSTOM_PASSWORD;
          customPassword: string;
      }
    | {
          type: DriveDocsPublicShareMessageType.READY_TO_RECEIVE_CUSTOM_PASSWORD;
      };
