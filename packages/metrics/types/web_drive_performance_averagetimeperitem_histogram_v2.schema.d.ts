/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Latency on average of the time it takes to load & render an item.
 */
export interface HttpsProtonMeWebDrivePerformanceAveragetimeperitemHistogramV2SchemaJson {
  Labels: {
    view: "list" | "grid";
    loadType: "first" | "subsequent";
    pageType: "filebrowser" | "computers" | "photos" | "shared_by_me" | "shared_with_me" | "trash";
  };
  Value: number;
}
