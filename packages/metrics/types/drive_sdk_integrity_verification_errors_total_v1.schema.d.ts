/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Drive verification issues
 */
export interface HttpsProtonMeDriveSdkIntegrityVerificationErrorsTotalV1SchemaJson {
  Labels: {
    volumeType: "own_volume" | "own_photo_volume" | "shared" | "shared_public" | "unknown";
    field:
      | "shareKey"
      | "nodeKey"
      | "nodeName"
      | "nodeHashKey"
      | "nodeExtendedAttributes"
      | "nodeContentKey"
      | "content";
    addressMatchingDefaultShare: "yes" | "no" | "unknown";
    fromBefore2024: "yes" | "no" | "unknown";
  };
  Value: number;
}
