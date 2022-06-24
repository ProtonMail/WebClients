export * from 'pmcrypto/lib/pmcrypto';

// export const signMessage = async ({ data }: { data: any }) => {
//     return { signature: data };
// };
// export const encryptMessage = async ({ data }: { data: any }) => {
//     return { data, signature: { packets: { write: () => data } } };
// };
// export const encryptSessionKey = async ({ data }: { data: any }) => {
//     return { message: data };
// };
// export const decryptSessionKey = async ({ message }: { message: any }) => {
//     return message;
// };
// export const getSignature = async (signature: any) => signature;
// export const getMessage = async (message: any) => message;
// export const getKeys = async (key: any) => key;
// export const generateSessionKey = async () => 'sessionkey';
// export const createCleartextMessage = (data: any) => data;
// export const verifyMessage = async () => {
//     return { verified: 1, signatureTimestamp: new Date() };
// };
// export const decryptMessage = async ({ message }: { message: any }) => {
//     return { data: message, verified: 1 };
// };
// export const VERIFICATION_STATUS = {
//     NOT_SIGNED: 0,
//     SIGNED_AND_VALID: 1,
//     SIGNED_AND_INVALID: 2,
// };
// export const splitMessage = async (data: any) => {
//     return { asymmetric: [data], encrypted: [data] };
// };
// export const getPreferredAlgorithm = async () => 'algo';
// export const generateKey = () => {
//     return { publicKeyArmored: 'publicKeyArmored', privateKeyArmored: 'privateKeyArmored' };
// };
// export const concatArrays = (array: any) => array;
// export const createMessage = (message: any) => message;
// export const armorBytes = (value: string) => value;
// export const binaryStringToArray = (value: any) => value;
// export const unsafeSHA1 = (value: any) => value;
// export const arrayToHexString = (value: any) => value;
