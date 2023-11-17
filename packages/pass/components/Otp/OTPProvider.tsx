import type { FC } from 'react';
import { createContext, useContext, useMemo } from 'react';

import { type UsePeriodOtpCodeOptions } from '@proton/pass/hooks/usePeriodicOtpCode';

type OTPContextValue = { generate: UsePeriodOtpCodeOptions['generate'] };
type OTPProviderProps = Pick<OTPContextValue, 'generate'>;

const OTPContext = createContext<OTPContextValue>({ generate: async () => null });

/** Depending on the client, the OTP generation handler will change :
 * - in the extension: leverage extension communication
 * - in the web-app: use the OTP utils in-place */
export const OTPProvider: FC<OTPProviderProps> = ({ generate, children }) => (
    <OTPContext.Provider value={useMemo(() => ({ generate }), [])}>{children}</OTPContext.Provider>
);

export const useOTPGenerate = () => useContext(OTPContext).generate;
