import { selectOrgTOTPDisabled } from '@proton/pass/store/selectors/organization';

import { WorkerMessageType } from '../../../types/messages';
import type * as ChannelMock from '../__mocks__/channel';
import { WorkerContext } from '../context/inject';
import { createOTPService } from './otp';

jest.mock('../channel');
jest.mock('@proton/pass/store/selectors/organization', () => ({
    ...jest.requireActual('@proton/pass/store/selectors/organization'),
    selectOrgTOTPDisabled: jest.fn(),
}));

const { mockHandlers } = jest.requireMock('../channel') as typeof ChannelMock;
const mockSelectOrgTOTPDisabled = jest.mocked(selectOrgTOTPDisabled);

const TOTP_URI = 'otpauth://totp/test?secret=JBSWY3DPEHPK3PXP&algorithm=SHA1&digits=6&period=30';

describe('OTP service - `OTP_CODE_GENERATE`', () => {
    const generate = () =>
        mockHandlers.get(WorkerMessageType.OTP_CODE_GENERATE)?.(
            { type: WorkerMessageType.OTP_CODE_GENERATE, payload: { type: 'uri', totpUri: TOTP_URI } },
            {}
        );

    beforeEach(() => {
        WorkerContext.set({ service: { store: { getState: jest.fn(() => ({})) } } } as any);
        createOTPService();
    });

    afterEach(() => {
        WorkerContext.clear();
        jest.clearAllMocks();
    });

    test('generates a 6-digit code when the organization allows TOTP', async () => {
        mockSelectOrgTOTPDisabled.mockReturnValue(false);
        const otp = await generate();
        expect(otp.token).toMatch(/^\d{6}$/);
    });

    test('refuses to generate a code when the organization disallows TOTP', async () => {
        mockSelectOrgTOTPDisabled.mockReturnValue(true);
        await expect(async () => generate()).rejects.toThrow('TOTP is disabled by the organization');
    });
});
