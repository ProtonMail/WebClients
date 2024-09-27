import { render } from '@testing-library/react';

import RecoveryCard from './RecoveryCard';

jest.mock('../../hooks/useIsSentinelUser', () => jest.fn());
jest.mock('../../hooks/useUser', () => jest.fn());
jest.mock('../../hooks/useUserSettings', () => jest.fn());
jest.mock('../../hooks/useRecoveryStatus', () => jest.fn());
jest.mock('@proton/components/hooks/recoveryFile/useIsRecoveryFileAvailable', () => jest.fn());
jest.mock('../../hooks/useIsMnemonicAvailable', () => jest.fn());
jest.mock('../../hooks/useIsDataRecoveryAvailable', () => jest.fn());
jest.mock('../../hooks/useHasOutdatedRecoveryFile', () => jest.fn());
jest.mock('../../hooks/useRecoverySecrets', () => jest.fn());
jest.mock('../../hooks/useConfig', () => jest.fn());

jest.mock('./RecoveryCardStatus', () => {
    return jest.fn(() => <div data-testid="mocked-recovery-card-status"></div>);
});

const canDisplayNewSentinelSettings = true; //for feature flag

const setupMocks = (isSentinelUser: boolean) => {
    require('../../hooks/useIsSentinelUser').mockReturnValue([{ isSentinelUser }, false]);
    require('../../hooks/useUser').mockReturnValue([{ MnemonicStatus: 3, Flags: { sso: false } }, false]);
    require('../../hooks/useUserSettings').mockReturnValue([
        { Email: { Value: '', Status: 0, Notify: 0, Reset: 0 }, Phone: { Value: '', Status: 0, Notify: 0, Reset: 0 } },
        false,
    ]);
    require('../../hooks/useRecoveryStatus').mockReturnValue([
        { accountRecoveryStatus: 'complete', dataRecoveryStatus: 'complete' },
        false,
    ]);
    require('../../hooks/recoveryFile/useIsRecoveryFileAvailable').mockReturnValue([
        { isRecoveryFileAvailable: true },
        false,
    ]);
    require('../../hooks/useIsMnemonicAvailable').mockReturnValue([{ isMnemonicAvailable: true }, false]);
    require('../../hooks/useIsDataRecoveryAvailable').mockReturnValue([{ isDataRecoveryAvailable: true }, false]);
    require('../../hooks/useHasOutdatedRecoveryFile').mockReturnValue(false);
    require('../../hooks/useRecoverySecrets').mockReturnValue(['key']);
    require('../../hooks/useConfig').mockReturnValue({ APP_NAME: 'proton-account' });
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RecoveryCard component', () => {
    test('renders one RecoveryCardStatus when isSentinelUser is true', () => {
        setupMocks(true);

        const { getAllByTestId } = render(
            <RecoveryCard
                ids={{ data: 'someData', account: `someAccount` }}
                canDisplayNewSentinelSettings={canDisplayNewSentinelSettings}
            />
        );
        const recoveryCardStatusComponents = getAllByTestId('mocked-recovery-card-status');
        expect(recoveryCardStatusComponents).toHaveLength(1);
        expect(require('./RecoveryCardStatus')).toHaveBeenCalledTimes(1);
    });

    test('renders two RecoveryCardStatus when isSentinelUser is false', () => {
        setupMocks(false);

        const { getAllByTestId } = render(<RecoveryCard ids={{ data: 'someData', account: `someAccount` }} />);
        const recoveryCardStatusComponents = getAllByTestId('mocked-recovery-card-status');
        expect(recoveryCardStatusComponents).toHaveLength(2);
        expect(require('./RecoveryCardStatus')).toHaveBeenCalledTimes(2);
    });
});
