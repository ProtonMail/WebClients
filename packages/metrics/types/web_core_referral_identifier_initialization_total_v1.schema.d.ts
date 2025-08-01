/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Measures initialization successes and failures
 */
export interface WebCoreReferralIdentifierInitializationTotal {
  Value: number;
  Labels: {
    status: "success" | "referral-code-no-found" | "failure" | "4xx" | "5xx";
  };
}
