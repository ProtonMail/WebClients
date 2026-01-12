import { getModelState } from '@proton/account/test';
import { AccessType } from '@proton/shared/lib/authentication/accessType';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { RetentionRule } from '@proton/shared/lib/interfaces/RetentionRule';
import { buildUser } from '@proton/testing/builders';

import { mailTestRender } from '../helpers/test/helper';
import { newElementsState } from '../store/elements/elementsSlice';
import { RouterMailboxContainer } from './RouterMailboxContainer';

describe('RouterMailboxContainer - Deleted folder redirect', () => {
    it('should redirect non-admin user from /deleted to /inbox', async () => {
        const { history } = await mailTestRender(<RouterMailboxContainer />, {
            initialPath: '/deleted',
            preloadedState: {
                user: getModelState(buildUser({ isAdmin: false })),
                elements: newElementsState({
                    params: {
                        labelID: MAILBOX_LABEL_IDS.SOFT_DELETED,
                    },
                }),
            },
        });

        expect(history.location.pathname).toBe('/inbox');
    });

    it('should NOT redirect admin user from /deleted route', async () => {
        const { history } = await mailTestRender(<RouterMailboxContainer />, {
            initialPath: '/deleted',
            preloadedState: {
                user: getModelState(buildUser({ isAdmin: true })),
                elements: newElementsState({
                    params: {
                        labelID: MAILBOX_LABEL_IDS.SOFT_DELETED,
                    },
                }),
                retentionPolicies: getModelState([{ ID: 'test-rule-1', Name: 'Test Rule' } as RetentionRule]),
            },
        });

        expect(history.location.pathname).toBe('/deleted');
    });

    it('should NOT redirect user signed in as org admin from /deleted route', async () => {
        const { history } = await mailTestRender(<RouterMailboxContainer />, {
            initialPath: '/deleted',
            preloadedState: {
                user: getModelState(buildUser({ isAdmin: false, accessType: AccessType.AdminAccess })),
                elements: newElementsState({
                    params: {
                        labelID: MAILBOX_LABEL_IDS.SOFT_DELETED,
                    },
                }),
                retentionPolicies: getModelState([{ ID: 'test-rule-1', Name: 'Test Rule' } as RetentionRule]),
            },
        });

        expect(history.location.pathname).toBe('/deleted');
    });

    it('should redirect admin user without retention rules from /deleted to /inbox', async () => {
        const { history } = await mailTestRender(<RouterMailboxContainer />, {
            initialPath: '/deleted',
            preloadedState: {
                user: getModelState(buildUser({ isAdmin: true })),
                elements: newElementsState({
                    params: {
                        labelID: MAILBOX_LABEL_IDS.SOFT_DELETED,
                    },
                }),
                retentionPolicies: getModelState([]),
            },
        });

        expect(history.location.pathname).toBe('/inbox');
    });
});
