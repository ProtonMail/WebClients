/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * How many users experienced decryption or verification error in the past 5 minutes
 */
export interface HttpsProtonMeDriveSdkIntegrityErroringUsersTotalV1SchemaJson {
  Labels: {
    volumeType: "own_volume" | "own_photo_volume" | "shared" | "shared_public" | "unknown";
    userPlan: "free" | "paid" | "anonymous" | "unknown";
  };
  Value: number;
}
