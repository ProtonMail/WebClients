import getSentinelRecoveryProps from './getSentinelRecoveryProps';

const text = {
    setRecoveryPhrase: 'Set recovery phrase',
    setRecoveryEmail: 'Add a recovery email address',
    setRecoveryPhone: 'Add a recovery phone number',
    disableRecoveryEmail: 'Disable recovery by email address',
    disableRecoveryPhone: 'Disable recovery by phone number',
    verifyRecoveryEmail: 'Verify email address',
    verifyRecoveryPhone: 'Verify phone number',
    statusTextSuccess: 'Your account recovery method is set',
    statusTextDanger: 'No account recovery method set; you are at risk of losing access to your account',
    statusTextWarningInsecure: 'To ensure continuous access to your account, set an account recovery method',
    statusTextWarning: 'To ensure highest possible security of your account',
};

const mockIds = { data: 'someData', account: `someAccount` };
// general email
const OUTCOMES = {
    UNSET: '',
    SET: 'test@proton.com',
    PHONESET: '555555555',
    UNVERIFIED: 0,
    VERIFIED: 1,
    DISABLED: 0,
    ENABLED: 1,
};

const emailOutcomes = [
    {
        description: 'email unset/unverified/disabled',
        case: {
            Value: OUTCOMES.UNSET,
            Status: OUTCOMES.UNVERIFIED,
            Notify: 0,
            Reset: OUTCOMES.DISABLED,
        },
    },
    {
        description: 'email set/unverified/disabled',
        case: {
            Value: OUTCOMES.SET,
            Status: OUTCOMES.UNVERIFIED,
            Notify: 0,
            Reset: OUTCOMES.DISABLED,
        },
    },
    {
        description: 'email set/unverified/enabled',
        case: {
            Value: OUTCOMES.SET,
            Status: OUTCOMES.UNVERIFIED,
            Notify: 0,
            Reset: OUTCOMES.ENABLED,
        },
    },
    {
        description: 'email set/verified/disabled',
        case: {
            Value: OUTCOMES.SET,
            Status: OUTCOMES.VERIFIED,
            Notify: 0,
            Reset: OUTCOMES.DISABLED,
        },
    },
    {
        description: 'email set/verified/enabled',
        case: {
            Value: OUTCOMES.SET,
            Status: OUTCOMES.VERIFIED,
            Notify: 0,
            Reset: OUTCOMES.ENABLED,
        },
    },
];

const phoneOutcomes = [
    {
        description: 'phone unset/unverified/disabled',
        case: {
            Value: OUTCOMES.UNSET,
            Status: OUTCOMES.UNVERIFIED,
            Notify: 0,
            Reset: OUTCOMES.DISABLED,
        },
    },
    {
        description: 'phone set/unverified/disabled',
        case: {
            Value: OUTCOMES.PHONESET,
            Status: OUTCOMES.UNVERIFIED,
            Notify: 0,
            Reset: OUTCOMES.DISABLED,
        },
    },
    {
        description: 'phone set/unverified/enabled',
        case: {
            Value: OUTCOMES.PHONESET,
            Status: OUTCOMES.UNVERIFIED,
            Notify: 0,
            Reset: OUTCOMES.ENABLED,
        },
    },
    {
        description: 'phone set/verified/disabled',
        case: {
            Value: OUTCOMES.PHONESET,
            Status: OUTCOMES.VERIFIED,
            Notify: 0,
            Reset: OUTCOMES.DISABLED,
        },
    },
    {
        description: 'phone set/verified/enabled',
        case: {
            Value: OUTCOMES.PHONESET,
            Status: OUTCOMES.VERIFIED,
            Notify: 0,
            Reset: OUTCOMES.ENABLED,
        },
    },
];

const casesWithoutMnemonic = {
    noAccountRecovery: {
        threeActions: [
            {
                desc: `${emailOutcomes[0].description} and ${phoneOutcomes[0].description}`,
                email: emailOutcomes[0].case,
                phone: phoneOutcomes[0].case,
                expected: [text.setRecoveryPhrase, text.setRecoveryEmail, text.setRecoveryPhone],
            },
            {
                desc: `${emailOutcomes[0].description} and ${phoneOutcomes[1].description}`,
                email: emailOutcomes[0].case,
                phone: phoneOutcomes[1].case,
                expected: [text.setRecoveryPhrase, text.setRecoveryEmail, text.verifyRecoveryPhone],
            },
            {
                desc: `${emailOutcomes[1].description} and ${phoneOutcomes[0].description}`,
                email: emailOutcomes[1].case,
                phone: phoneOutcomes[0].case,
                expected: [text.setRecoveryPhrase, text.verifyRecoveryEmail, text.setRecoveryPhone],
            },
            {
                desc: `${emailOutcomes[1].description} and ${phoneOutcomes[1].description}`,
                email: emailOutcomes[1].case,
                phone: phoneOutcomes[1].case,
                expected: [text.setRecoveryPhrase, text.verifyRecoveryEmail, text.verifyRecoveryPhone],
            },
        ],
        twoActions: [
            {
                desc: `${emailOutcomes[3].description} and ${phoneOutcomes[0].description}`,
                email: emailOutcomes[3].case,
                phone: phoneOutcomes[0].case,
                expected: [text.setRecoveryPhrase, text.setRecoveryPhone],
            },
            {
                desc: `${emailOutcomes[3].description} and ${phoneOutcomes[1].description}`,
                email: emailOutcomes[3].case,
                phone: phoneOutcomes[1].case,
                expected: [text.setRecoveryPhrase, text.verifyRecoveryPhone],
            },
            {
                desc: `${emailOutcomes[0].description} and ${phoneOutcomes[3].description}`,
                email: emailOutcomes[0].case,
                phone: phoneOutcomes[3].case,
                expected: [text.setRecoveryPhrase, text.setRecoveryEmail],
            },
            {
                desc: `${emailOutcomes[1].description} and ${phoneOutcomes[3].description}`,
                email: emailOutcomes[1].case,
                phone: phoneOutcomes[3].case,
                expected: [text.setRecoveryPhrase, text.verifyRecoveryEmail],
            },
        ],
        oneAction: [
            {
                desc: `${emailOutcomes[3].description} and ${phoneOutcomes[3].description}`,
                email: emailOutcomes[3].case,
                phone: phoneOutcomes[3].case,
                expected: [text.setRecoveryPhrase],
            },
        ],
    },
    continuousAccess: {
        threeActions: [
            {
                desc: `${emailOutcomes[0].description} and ${phoneOutcomes[2].description}`,
                email: emailOutcomes[0].case,
                phone: phoneOutcomes[2].case,
                expected: [text.setRecoveryPhrase, text.setRecoveryEmail, text.verifyRecoveryPhone],
            },
            {
                desc: `${emailOutcomes[1].description} and ${phoneOutcomes[2].description}`,
                email: emailOutcomes[1].case,
                phone: phoneOutcomes[2].case,
                expected: [text.setRecoveryPhrase, text.verifyRecoveryEmail, text.verifyRecoveryPhone],
            },
            {
                desc: `${emailOutcomes[2].description} and ${phoneOutcomes[0].description}`,
                email: emailOutcomes[2].case,
                phone: phoneOutcomes[0].case,
                expected: [text.setRecoveryPhrase, text.verifyRecoveryEmail, text.setRecoveryPhone],
            },
            {
                desc: `${emailOutcomes[2].description} and ${phoneOutcomes[1].description}`,
                email: emailOutcomes[2].case,
                phone: phoneOutcomes[1].case,
                expected: [text.setRecoveryPhrase, text.verifyRecoveryEmail, text.verifyRecoveryPhone],
            },
            {
                desc: `${emailOutcomes[2].description} and ${phoneOutcomes[2].description}`,
                email: emailOutcomes[2].case,
                phone: phoneOutcomes[2].case,
                expected: [text.setRecoveryPhrase, text.verifyRecoveryEmail, text.verifyRecoveryPhone],
            },
        ],
        twoActions: [
            {
                desc: `${emailOutcomes[3].description} and ${phoneOutcomes[2].description}`,
                email: emailOutcomes[3].case,
                phone: phoneOutcomes[2].case,
                expected: [text.setRecoveryPhrase, text.verifyRecoveryPhone],
            },
            {
                desc: `${emailOutcomes[2].description} and ${phoneOutcomes[3].description}`,
                email: emailOutcomes[2].case,
                phone: phoneOutcomes[3].case,
                expected: [text.setRecoveryPhrase, text.verifyRecoveryEmail],
            },
        ],
    },
    highestSecurity: {
        twoActionsEmailSVE: [
            {
                desc: `${emailOutcomes[4].description} and ${phoneOutcomes[0].description}`,
                email: emailOutcomes[4].case,
                phone: phoneOutcomes[0].case,
                expected: [text.setRecoveryPhrase, text.setRecoveryPhone],
            },
            {
                desc: `${emailOutcomes[4].description} and ${phoneOutcomes[1].description}`,
                email: emailOutcomes[4].case,
                phone: phoneOutcomes[1].case,
                expected: [text.setRecoveryPhrase, text.verifyRecoveryPhone],
            },
            {
                desc: `${emailOutcomes[4].description} and ${phoneOutcomes[2].description}`,
                email: emailOutcomes[4].case,
                phone: phoneOutcomes[2].case,
                expected: [text.setRecoveryPhrase, text.verifyRecoveryPhone],
            },
        ],
        twoActionsPhoneSVE: [
            {
                desc: `${emailOutcomes[0].description} and ${phoneOutcomes[4].description}`,
                email: emailOutcomes[0].case,
                phone: phoneOutcomes[4].case,
                expected: [text.setRecoveryPhrase, text.setRecoveryEmail],
            },
            {
                desc: `${emailOutcomes[1].description} and ${phoneOutcomes[4].description}`,
                email: emailOutcomes[1].case,
                phone: phoneOutcomes[4].case,
                expected: [text.setRecoveryPhrase, text.verifyRecoveryEmail],
            },
            {
                desc: `${emailOutcomes[2].description} and ${phoneOutcomes[4].description}`,
                email: emailOutcomes[2].case,
                phone: phoneOutcomes[4].case,
                expected: [text.setRecoveryPhrase, text.verifyRecoveryEmail],
            },
        ],
        oneActionBothSVEorSVD: [
            {
                desc: `${emailOutcomes[3].description} and ${phoneOutcomes[4].description}`,
                email: emailOutcomes[3].case,
                phone: phoneOutcomes[4].case,
                expected: [text.setRecoveryPhrase],
            },
            {
                desc: `${emailOutcomes[4].description} and ${phoneOutcomes[3].description}`,
                email: emailOutcomes[4].case,
                phone: phoneOutcomes[3].case,
                expected: [text.setRecoveryPhrase],
            },
            {
                desc: `${emailOutcomes[4].description} and ${phoneOutcomes[4].description}`,
                email: emailOutcomes[4].case,
                phone: phoneOutcomes[4].case,
                expected: [text.setRecoveryPhrase],
            },
        ],
    },
};

const casesWithMnemonic = {
    bestCase: [
        {
            desc: `${emailOutcomes[3].description} and ${phoneOutcomes[3].description}`,
            email: emailOutcomes[3].case,
            phone: phoneOutcomes[3].case,
            expected: [],
        },
    ],
    emailOrPhoneSentinelConfigured: [
        {
            desc: `${emailOutcomes[3].description} and ${phoneOutcomes[0].description}`,
            email: emailOutcomes[3].case,
            phone: phoneOutcomes[0].case,
            expected: [text.setRecoveryPhone],
        },
        {
            desc: `${emailOutcomes[3].description} and ${phoneOutcomes[1].description}`,
            email: emailOutcomes[3].case,
            phone: phoneOutcomes[1].case,
            expected: [text.verifyRecoveryPhone],
        },
        {
            desc: `${emailOutcomes[3].description} and ${phoneOutcomes[2].description}`,
            email: emailOutcomes[3].case,
            phone: phoneOutcomes[2].case,
            expected: [text.disableRecoveryPhone],
        },
        {
            desc: `${emailOutcomes[3].description} and ${phoneOutcomes[4].description}`,
            email: emailOutcomes[3].case,
            phone: phoneOutcomes[4].case,
            expected: [text.disableRecoveryPhone],
        },
        {
            desc: `${emailOutcomes[0].description} and ${phoneOutcomes[3].description}`,
            email: emailOutcomes[0].case,
            phone: phoneOutcomes[3].case,
            expected: [text.setRecoveryEmail],
        },
        {
            desc: `${emailOutcomes[1].description} and ${phoneOutcomes[3].description}`,
            email: emailOutcomes[1].case,
            phone: phoneOutcomes[3].case,
            expected: [text.verifyRecoveryEmail],
        },
        {
            desc: `${emailOutcomes[2].description} and ${phoneOutcomes[3].description}`,
            email: emailOutcomes[2].case,
            phone: phoneOutcomes[3].case,
            expected: [text.disableRecoveryEmail],
        },
        {
            desc: `${emailOutcomes[4].description} and ${phoneOutcomes[3].description}`,
            email: emailOutcomes[4].case,
            phone: phoneOutcomes[3].case,
            expected: [text.disableRecoveryEmail],
        },
    ],
    emailNotSetUnverifiedDisabled: [
        {
            desc: `${emailOutcomes[0].description} and ${phoneOutcomes[0].description}`,
            email: emailOutcomes[0].case,
            phone: phoneOutcomes[0].case,
            expected: [text.setRecoveryEmail, text.setRecoveryPhone],
        },
        {
            desc: `${emailOutcomes[0].description} and ${phoneOutcomes[1].description}`,
            email: emailOutcomes[0].case,
            phone: phoneOutcomes[1].case,
            expected: [text.setRecoveryEmail, text.verifyRecoveryPhone],
        },
        {
            desc: `${emailOutcomes[0].description} and ${phoneOutcomes[2].description}`,
            email: emailOutcomes[0].case,
            phone: phoneOutcomes[2].case,
            expected: [text.disableRecoveryPhone, text.setRecoveryEmail],
        },
        {
            desc: `${emailOutcomes[0].description} and ${phoneOutcomes[4].description}`,
            email: emailOutcomes[0].case,
            phone: phoneOutcomes[4].case,
            expected: [text.disableRecoveryPhone, text.setRecoveryEmail],
        },
    ],
    emailSetUnverifiedDisabled: [
        {
            desc: `${emailOutcomes[1].description} and ${phoneOutcomes[0].description}`,
            email: emailOutcomes[1].case,
            phone: phoneOutcomes[0].case,
            expected: [text.verifyRecoveryEmail, text.setRecoveryPhone],
        },
        {
            desc: `${emailOutcomes[1].description} and ${phoneOutcomes[1].description}`,
            email: emailOutcomes[1].case,
            phone: phoneOutcomes[1].case,
            expected: [text.verifyRecoveryEmail, text.verifyRecoveryPhone],
        },
        {
            desc: `${emailOutcomes[1].description} and ${phoneOutcomes[2].description}`,
            email: emailOutcomes[1].case,
            phone: phoneOutcomes[2].case,
            expected: [text.disableRecoveryPhone, text.verifyRecoveryEmail],
        },
        {
            desc: `${emailOutcomes[1].description} and ${phoneOutcomes[4].description}`,
            email: emailOutcomes[1].case,
            phone: phoneOutcomes[4].case,
            expected: [text.disableRecoveryPhone, text.verifyRecoveryEmail],
        },
    ],
    emailSetUnverifiedEnabled: [
        {
            desc: `${emailOutcomes[2].description} and ${phoneOutcomes[0].description}`,
            email: emailOutcomes[2].case,
            phone: phoneOutcomes[0].case,
            expected: [text.disableRecoveryEmail, text.setRecoveryPhone],
        },
        {
            desc: `${emailOutcomes[2].description} and ${phoneOutcomes[1].description}`,
            email: emailOutcomes[2].case,
            phone: phoneOutcomes[1].case,
            expected: [text.disableRecoveryEmail, text.verifyRecoveryPhone],
        },
        {
            desc: `${emailOutcomes[2].description} and ${phoneOutcomes[2].description}`,
            email: emailOutcomes[2].case,
            phone: phoneOutcomes[2].case,
            expected: [text.disableRecoveryEmail, text.disableRecoveryPhone],
        },
        {
            desc: `${emailOutcomes[2].description} and ${phoneOutcomes[4].description}`,
            email: emailOutcomes[2].case,
            phone: phoneOutcomes[4].case,
            expected: [text.disableRecoveryEmail, text.disableRecoveryPhone],
        },
    ],
    emailSetVerifiedEnabled: [
        {
            desc: `${emailOutcomes[4].description} and ${phoneOutcomes[0].description}`,
            email: emailOutcomes[4].case,
            phone: phoneOutcomes[0].case,
            expected: [text.disableRecoveryEmail, text.setRecoveryPhone],
        },
        {
            desc: `${emailOutcomes[4].description} and ${phoneOutcomes[1].description}`,
            email: emailOutcomes[4].case,
            phone: phoneOutcomes[1].case,
            expected: [text.disableRecoveryEmail, text.verifyRecoveryPhone],
        },
        {
            desc: `${emailOutcomes[4].description} and ${phoneOutcomes[2].description}`,
            email: emailOutcomes[4].case,
            phone: phoneOutcomes[2].case,
            expected: [text.disableRecoveryEmail, text.disableRecoveryPhone],
        },
        {
            desc: `${emailOutcomes[4].description} and ${phoneOutcomes[4].description}`,
            email: emailOutcomes[4].case,
            phone: phoneOutcomes[4].case,
            expected: [text.disableRecoveryEmail, text.disableRecoveryPhone],
        },
    ],
};

const executeTest = (
    cases: {
        desc: string;
        email: {
            Value: string;
            Status: number;
            Notify: number;
            Reset: number;
        };
        phone: {
            Value: string;
            Status: number;
            Notify: number;
            Reset: number;
        };
        expected: string[] | [];
    }[],
    hasMnemonic: boolean,
    expectedStatusText: string,
    expectedCTALength: number
): void => {
    test.each(cases)(`$desc`, ({ email, phone, expected }) => {
        const result = getSentinelRecoveryProps(email, phone, hasMnemonic, mockIds);
        const callToActions = result.callToActions ?? [];

        expect(result.statusText).toBe(expectedStatusText);
        expect(callToActions.length).toBe(expectedCTALength);

        callToActions.forEach((action, index) => {
            expect(action.text).toBe(expected[index]);
        });
    });
};

describe('getSentinelRecoveryProps returns status text "No account recovery..." when user does not have a recovery phrase', () => {
    const expectedStatusText = text.statusTextDanger;

    describe('returns 3 actions in the correct order', () => {
        const expectedCTALength = 3;
        executeTest(casesWithoutMnemonic.noAccountRecovery.threeActions, false, expectedStatusText, expectedCTALength);
    });

    describe('returns 2 actions in the correct order', () => {
        const expectedCTALength = 2;
        executeTest(casesWithoutMnemonic.noAccountRecovery.twoActions, false, expectedStatusText, expectedCTALength);
    });

    describe('returns 1 action', () => {
        const expectedCTALength = 1;
        executeTest(casesWithoutMnemonic.noAccountRecovery.oneAction, false, expectedStatusText, expectedCTALength);
    });
});

describe('getSentinelRecoveryProps returns status text "To ensure continuous access..." when user does not have a recovery phrase', () => {
    const expectedStatusText = text.statusTextWarningInsecure;

    describe('returns 3 actions in the correct order', () => {
        const expectedCTALength = 3;
        executeTest(casesWithoutMnemonic.continuousAccess.threeActions, false, expectedStatusText, expectedCTALength);
    });

    describe('returns 2 actions in the correct order', () => {
        const expectedCTALength = 2;
        executeTest(casesWithoutMnemonic.continuousAccess.twoActions, false, expectedStatusText, expectedCTALength);
    });
});

describe('getSentinelRecoveryProps returns status text "To ensure highest possible security..." when user does not have a recovery phrase', () => {
    const expectedStatusText = text.statusTextWarning;

    describe('returns 2 actions in the correct order when email is set/verified/enabled', () => {
        const expectedCTALength = 2;
        executeTest(
            casesWithoutMnemonic.highestSecurity.twoActionsEmailSVE,
            false,
            expectedStatusText,
            expectedCTALength
        );
    });

    describe('returns 2 actions in the correct order when phone is set/verified/enabled', () => {
        const expectedCTALength = 2;
        executeTest(
            casesWithoutMnemonic.highestSecurity.twoActionsPhoneSVE,
            false,
            expectedStatusText,
            expectedCTALength
        );
    });

    describe('returns 1 action when both are either set/verified/enabled or set/verified/disabled or both set/verified/enabled', () => {
        const expectedCTALength = 1;
        executeTest(
            casesWithoutMnemonic.highestSecurity.oneActionBothSVEorSVD,
            false,
            expectedStatusText,
            expectedCTALength
        );
    });
});

describe('getSentinelRecoveryProps returns status text "Your account recovery is set" when user has a recovery phrase and both email/phone sentinel configured', () => {
    const expectedStatusText = text.statusTextSuccess;
    const expectedCTALength = 0;

    executeTest(casesWithMnemonic.bestCase, true, expectedStatusText, expectedCTALength);
});

describe('getSentinelRecoveryProps returns status text "To ensure highest possible security..." when user has a recovery phrase and email OR phone sentinel configured', () => {
    const expectedStatusText = text.statusTextWarning;
    const expectedCTALength = 1;

    describe('returns 1 action', () => {
        executeTest(casesWithMnemonic.emailOrPhoneSentinelConfigured, true, expectedStatusText, expectedCTALength);
    });
});

describe('getSentinelRecoveryProps returns status text "To ensure highest possible security..." when user has a recovery phrase', () => {
    const expectedStatusText = text.statusTextWarning;
    const expectedCTALength = 2;

    describe('returns 2 actions in the correct order when email is unset/unverified/disabled', () => {
        executeTest(casesWithMnemonic.emailNotSetUnverifiedDisabled, true, expectedStatusText, expectedCTALength);
    });

    describe('returns 2 actions in the correct order when email is set/unverified/disabled', () => {
        executeTest(casesWithMnemonic.emailSetUnverifiedDisabled, true, expectedStatusText, expectedCTALength);
    });

    describe('returns 2 actions in the correct order when email is set/unverified/enabled', () => {
        executeTest(casesWithMnemonic.emailSetUnverifiedEnabled, true, expectedStatusText, expectedCTALength);
    });

    describe('returns 2 actions in the correct order when email is set/verified/enabled', () => {
        executeTest(casesWithMnemonic.emailSetVerifiedEnabled, true, expectedStatusText, expectedCTALength);
    });
});
