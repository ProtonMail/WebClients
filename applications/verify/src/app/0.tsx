// BigInt is not important to the verify app, however there are some statically defined constants of BigInt in pmcrypto
// This is a patch to avoid it erroring out on "BigInt is not defined".
// Why is pmcrypto even imported in verify?
if (!('BigInt' in window)) {
    // @ts-ignore
    window.BigInt = () => {};
}
