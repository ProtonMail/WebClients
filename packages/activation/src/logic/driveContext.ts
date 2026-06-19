import { createContext, useContext } from 'react';

import type { ProtonDriveClient } from '@protontech/drive-sdk';

const DriveSdkContext = createContext<ProtonDriveClient | undefined>(undefined);

export const DriveSdkContextProvider = DriveSdkContext.Provider;

export const useDriveSdk = () => useContext(DriveSdkContext);
