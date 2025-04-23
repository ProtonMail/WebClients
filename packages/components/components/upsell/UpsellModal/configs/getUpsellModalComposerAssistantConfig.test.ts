import * as memberModule from '@proton/account/member';
import * as organizationModule from '@proton/account/organization';
import * as assistantUpsellConfigModule from '@proton/components/hooks/assistant/assistantUpsellConfig';
import { CYCLE, type Currency, PLANS, PLAN_TYPES, type PaymentsApi, type Plan } from '@proton/payments';
import * as organizationHelperModule from '@proton/shared/lib/organization/helper';

import * as composerAssistantUpsellModalHelpersModule from '../../modals/ComposerAssistantUpsellModal.helpers';
import { UpsellModalComposerAssistantSubmitButton } from '../components/UpsellModalSubmitButtons';
import { getUpsellModalComposerAssistantConfig } from './getUpsellModalComposerAssistantConfig';

jest.mock('@proton/payments/core/subscription/selected-plan', () => ({
    SelectedPlan: { createFromSubscription: jest.fn() },
}));
jest.mock('@proton/account/organization');
jest.mock('@proton/account/member');
jest.mock('../../modals/ComposerAssistantUpsellModal.helpers');
jest.mock('@proton/shared/lib/organization/helper');
jest.mock('@proton/components/hooks/assistant/assistantUpsellConfig');
let fakeDispatch = (result: unknown) => Promise.resolve(result);

let organisationThunkMock = jest.fn();
let memberThunkMock = jest.fn();
let getIsB2CUserAbleToRunScribeMock = jest.fn();
let getIsOrganizationUserMock = jest.fn();
let getIsSuperAdminMock = jest.fn();
// @ts-expect-error - mock
let paymentsApiMock: PaymentsApi = {
    checkWithAutomaticVersion: jest.fn(),
};

let getAssistantUpsellConfigPlanAndCycleMock = jest.fn();

let NON_MAIN_CURRENCY_MOCK_AMOUNT = 20 * 12;

const PROTON_DUO_YEARLY_PRICE = 100;

async function setupTest(currency: Currency, userType: 'B2C' | 'B2B', isOrgAdmin?: boolean) {
    jest.spyOn(organizationModule, 'organizationThunk').mockImplementation(organisationThunkMock);
    jest.spyOn(memberModule, 'memberThunk').mockImplementation(memberThunkMock);

    getIsB2CUserAbleToRunScribeMock.mockReturnValue(userType === 'B2C');
    jest.spyOn(composerAssistantUpsellModalHelpersModule, 'getIsB2CUserAbleToRunScribe').mockImplementation(
        getIsB2CUserAbleToRunScribeMock
    );

    getIsOrganizationUserMock.mockReturnValue(userType === 'B2B');
    jest.spyOn(organizationHelperModule, 'isOrganization').mockImplementation(getIsOrganizationUserMock);

    getIsSuperAdminMock.mockReturnValue(userType === 'B2B' && isOrgAdmin);
    jest.spyOn(organizationHelperModule, 'isSuperAdmin').mockImplementation(getIsSuperAdminMock);

    getAssistantUpsellConfigPlanAndCycleMock.mockReturnValue(
        ['B2C', 'B2B'].includes(userType)
            ? {
                  planIDs: 'FAKE_PLAN_IDS',
                  cycle: 'FAKE_CYCLE',
                  minimumCycle: 'FAKE_MINIMUM_CYCLE',
                  maximumCycle: 'FAKE_MAXIMUM_CYCLE',
              }
            : undefined
    );

    jest.spyOn(assistantUpsellConfigModule, 'getAssistantUpsellConfigPlanAndCycle').mockImplementation(
        getAssistantUpsellConfigPlanAndCycleMock
    );

    // @ts-expect-error - mock of paymentApi call
    paymentsApiMock.checkWithAutomaticVersion.mockResolvedValue({
        AmountDue: NON_MAIN_CURRENCY_MOCK_AMOUNT,
    });

    const config = await getUpsellModalComposerAssistantConfig({
        // @ts-expect-error - fakeDispatch is a mock
        dispatch: fakeDispatch,
        // @ts-expect-error - fake user for test purposes
        user: { isAdmin: !!isOrgAdmin },
        currency,
        getFlags: jest.fn(),
        paymentsApi: paymentsApiMock,
        plans: [
            {
                ID: PLANS.DUO,
                Type: PLAN_TYPES.PLAN,
                Name: PLANS.DUO,
                Currency: 'USD',
                Amount: 10,
                Pricing: {
                    [CYCLE.MONTHLY]: 10,
                    [CYCLE.YEARLY]: PROTON_DUO_YEARLY_PRICE,
                    [CYCLE.TWO_YEARS]: 150,
                },
            } as unknown as Plan,
        ],
    });

    return {
        config,
        organisationThunkMock,
        memberThunkMock,
        getIsB2CUserAbleToRunScribeMock,
        getIsOrganizationUserMock,
        getIsSuperAdminMock,
    };
}

describe('getUpsellModalComposerAssistantConfig', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('B2C users', () => {
        it('When main currency it should return correct config', async () => {
            const { config } = await setupTest('USD', 'B2C');

            // Check that the organization and member thunks are called once
            expect(organisationThunkMock).toHaveBeenCalledTimes(1);
            expect(memberThunkMock).toHaveBeenCalledTimes(1);
            expect(getIsB2CUserAbleToRunScribeMock).toHaveBeenCalledTimes(1);
            expect(getIsOrganizationUserMock).toHaveBeenCalledTimes(1);
            // Should not be reached
            expect(getIsSuperAdminMock).toHaveBeenCalledTimes(0);

            expect(config).toHaveProperty('planIDs', { [PLANS.DUO]: 1 });
            expect(config).toHaveProperty('cycle', CYCLE.YEARLY);
            expect(config).toHaveProperty('submitText', `Get the writing assistant`);

            expect(config.footerText).not.toBeNull();
            // @ts-expect-error - footerText is an array because of ttag
            expect(config.footerText[1].props.currency).toBe('USD');
            // @ts-expect-error - footerText is an array because of ttag
            expect(config.footerText[1].props.children).toBe(PROTON_DUO_YEARLY_PRICE / 12);
        });

        it('When non main currency it should return correct config', async () => {
            const { config } = await setupTest('BRL', 'B2C');

            // Check that the organization and member thunks are called once
            expect(organisationThunkMock).toHaveBeenCalledTimes(1);
            expect(memberThunkMock).toHaveBeenCalledTimes(1);
            expect(getIsB2CUserAbleToRunScribeMock).toHaveBeenCalledTimes(1);
            expect(getIsOrganizationUserMock).toHaveBeenCalledTimes(1);
            // Should not be reached
            expect(getIsSuperAdminMock).toHaveBeenCalledTimes(0);

            expect(config).toHaveProperty('planIDs', { [PLANS.DUO]: 1 });
            expect(config).toHaveProperty('cycle', CYCLE.YEARLY);
            expect(config).toHaveProperty('submitText', `Get the writing assistant`);
            expect(config.footerText).not.toBeNull();
            // @ts-expect-error - footerText is an array because of ttag
            expect(config.footerText[1].props.currency).toBe('BRL');
            // @ts-expect-error - footerText is an array because of ttag
            expect(config.footerText[1].props.children).toBe(NON_MAIN_CURRENCY_MOCK_AMOUNT / 12);
        });
    });

    describe('B2B org users', () => {
        it('When main currency it should return correct config', async () => {
            const { config } = await setupTest('USD', 'B2B');

            // Check that the organization and member thunks are called once
            expect(organisationThunkMock).toHaveBeenCalledTimes(1);
            expect(memberThunkMock).toHaveBeenCalledTimes(1);
            expect(getIsB2CUserAbleToRunScribeMock).toHaveBeenCalledTimes(1);
            expect(getIsOrganizationUserMock).toHaveBeenCalledTimes(1);
            // Should not be reached
            expect(getIsSuperAdminMock).toHaveBeenCalledTimes(1);

            expect(config).toHaveProperty('planIDs', 'FAKE_PLAN_IDS');
            expect(config).toHaveProperty('cycle', 'FAKE_CYCLE');
            expect(config.configOverride).toBeDefined();
            // Should be react component
            expect(typeof config.submitText).toBe('function');
            expect(config.submitText).toBe(UpsellModalComposerAssistantSubmitButton);

            // Should be react component
            expect(config.footerText).toBeNull();
        });

        it('When non main currency it should return correct config', async () => {
            const { config } = await setupTest('BRL', 'B2B');

            // Check that the organization and member thunks are called once
            expect(organisationThunkMock).toHaveBeenCalledTimes(1);
            expect(memberThunkMock).toHaveBeenCalledTimes(1);
            expect(getIsB2CUserAbleToRunScribeMock).toHaveBeenCalledTimes(1);
            expect(getIsOrganizationUserMock).toHaveBeenCalledTimes(1);
            // Should not be reached
            expect(getIsSuperAdminMock).toHaveBeenCalledTimes(1);

            expect(config).toHaveProperty('planIDs', 'FAKE_PLAN_IDS');
            expect(config).toHaveProperty('cycle', 'FAKE_CYCLE');
            expect(config.configOverride).toBeDefined();
            // Should be react component
            expect(typeof config.submitText).toBe('function');
            expect(config.submitText).toBe(UpsellModalComposerAssistantSubmitButton);

            // Should be react component
            expect(config.footerText).toBeNull();
        });
    });

    describe('B2B org admin users', () => {
        it('When main currency it should return correct config', async () => {
            const { config } = await setupTest('USD', 'B2B', true);

            // Check that the organization and member thunks are called once
            expect(organisationThunkMock).toHaveBeenCalledTimes(1);
            expect(memberThunkMock).toHaveBeenCalledTimes(1);
            expect(getIsB2CUserAbleToRunScribeMock).toHaveBeenCalledTimes(1);
            expect(getIsOrganizationUserMock).toHaveBeenCalledTimes(1);
            // Should not be reached
            expect(getIsSuperAdminMock).toHaveBeenCalledTimes(1);

            expect(config).toHaveProperty('planIDs', 'FAKE_PLAN_IDS');
            expect(config).toHaveProperty('cycle', 'FAKE_CYCLE');
            expect(config.configOverride).toBeDefined();
            expect(config.submitText).toBe('Get the writing assistant');

            // Should be react component
            expect(config.footerText).toBeNull();
        });

        it('When non main currency it should return correct config', async () => {
            const { config } = await setupTest('BRL', 'B2B');

            // Check that the organization and member thunks are called once
            expect(organisationThunkMock).toHaveBeenCalledTimes(1);
            expect(memberThunkMock).toHaveBeenCalledTimes(1);
            expect(getIsB2CUserAbleToRunScribeMock).toHaveBeenCalledTimes(1);
            expect(getIsOrganizationUserMock).toHaveBeenCalledTimes(1);
            // Should not be reached
            expect(getIsSuperAdminMock).toHaveBeenCalledTimes(1);

            expect(config).toHaveProperty('planIDs', 'FAKE_PLAN_IDS');
            expect(config).toHaveProperty('cycle', 'FAKE_CYCLE');
            expect(config.configOverride).toBeDefined();
            // Should be react component
            expect(typeof config.submitText).toBe('function');
            expect(config.submitText).toBe(UpsellModalComposerAssistantSubmitButton);

            // Should be react component
            expect(config.footerText).toBeNull();
        });
    });

    it('Should throw an error if no config is found', async () => {
        let hasThrown = false;
        try {
            // @ts-expect-error - fake currency for test purposes
            await setupTest('AAA', 'BBB');
        } catch (error) {
            hasThrown = true;
        }

        expect(hasThrown).toBe(true);
    });
});
