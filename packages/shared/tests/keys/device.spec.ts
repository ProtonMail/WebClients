import {
    ConfirmationCodeVersion,
    deserializeAuthDeviceSecretData,
    generateAuthDeviceSecretData,
    getAuthDeviceConfirmationCodeVersion,
    getAuthDeviceSecretConfirmationCode,
    getDisplayedAuthDeviceConfirmationCode,
    isValidAuthDeviceConfirmationCode,
    producedConfirmationCodeVersion,
} from '../../lib/keys/device';

// 32 zero bytes, base64 encoded
const serializedSecret = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
const v1Code = '6MRK';
const v2Code = 'A5J3';

describe('auth device confirmation code', () => {
    it('keeps the v1 code stable for clients that have not upgraded', async () => {
        expect(await getAuthDeviceSecretConfirmationCode(serializedSecret, ConfirmationCodeVersion.V1)).toBe(v1Code);
    });

    it('derives the v2 code from the digest bytes', async () => {
        expect(await getAuthDeviceSecretConfirmationCode(serializedSecret, ConfirmationCodeVersion.V2)).toBe(v2Code);
    });

    it('displays the version the API recorded for the device', async () => {
        const deviceSecretData = await deserializeAuthDeviceSecretData('deviceID', serializedSecret);

        // A device enrolled before the client moved on still displays what its verifiers derive
        expect(
            getDisplayedAuthDeviceConfirmationCode({
                deviceOutput: { ConfirmationCodeVersion: ConfirmationCodeVersion.V1 },
                deviceSecretData,
            })
        ).toBe(v1Code);
        expect(
            getDisplayedAuthDeviceConfirmationCode({
                deviceOutput: { ConfirmationCodeVersion: ConfirmationCodeVersion.V2 },
                deviceSecretData,
            })
        ).toBe(v2Code);
    });

    it('displays a code a verifier accepts', async () => {
        const deviceSecretData = await deserializeAuthDeviceSecretData('deviceID', serializedSecret);
        const authDevice = { ConfirmationCodeVersion: producedConfirmationCodeVersion };

        expect(
            isValidAuthDeviceConfirmationCode({
                authDevice,
                deviceSecretData,
                confirmationCode: getDisplayedAuthDeviceConfirmationCode({
                    deviceOutput: authDevice,
                    deviceSecretData,
                }),
            })
        ).toBe(true);
    });

    it('verifies against the version the device reported', async () => {
        const deviceSecretData = await deserializeAuthDeviceSecretData('deviceID', serializedSecret);
        const v2Device = { ConfirmationCodeVersion: ConfirmationCodeVersion.V2 };

        expect(
            isValidAuthDeviceConfirmationCode({ authDevice: v2Device, deviceSecretData, confirmationCode: v2Code })
        ).toBe(true);
        // A v2 device showing a v1 code is a different device, not a lenient match
        expect(
            isValidAuthDeviceConfirmationCode({ authDevice: v2Device, deviceSecretData, confirmationCode: v1Code })
        ).toBe(false);
    });

    it('treats a device with no reported version as v1', async () => {
        const deviceSecretData = await deserializeAuthDeviceSecretData('deviceID', serializedSecret);
        const legacyDevice = {};

        expect(getAuthDeviceConfirmationCodeVersion(legacyDevice)).toBe(ConfirmationCodeVersion.V1);
        expect(
            isValidAuthDeviceConfirmationCode({ authDevice: legacyDevice, deviceSecretData, confirmationCode: v1Code })
        ).toBe(true);
        expect(
            isValidAuthDeviceConfirmationCode({ authDevice: legacyDevice, deviceSecretData, confirmationCode: v2Code })
        ).toBe(false);
    });

    it('rejects a code that matches no version', async () => {
        const deviceSecretData = await deserializeAuthDeviceSecretData('deviceID', serializedSecret);

        expect(isValidAuthDeviceConfirmationCode({ authDevice: {}, deviceSecretData, confirmationCode: 'ZZZZ' })).toBe(
            false
        );
    });

    it('generates a 4 character code for every version', async () => {
        const { confirmationCodes } = await generateAuthDeviceSecretData();

        expect(confirmationCodes[ConfirmationCodeVersion.V1]).toHaveLength(4);
        expect(confirmationCodes[ConfirmationCodeVersion.V2]).toHaveLength(4);
    });
});
