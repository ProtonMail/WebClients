import type { ReactNode } from 'react';

import { useSelector } from '@xstate/react';
import type { SnapshotFrom } from 'xstate';

import { type SignInStateMachine, type SignInStep, selectStep } from '../state-machine/SignInStateMachine';
import type { passwordAccountStateMachine } from '../steps/password-account/state-machine/passwordAccountStateMachine';
import { SignInContext } from '../wizard/SignInContext';
import { useSignInProps } from '../wizard/SignInProvider';
import type { SignInActorRoute, SignInScreenActor } from './signInRoute';

export type SignInRoutesTable = Record<SignInScreenActor, SignInActorRoute>;

/**
 * The actor behind each of the route table's ids, while its parent runs it: each step's flow as a child of the sign-in,
 * and the lost-2FA flow as a child of the password flow.
 */
type SignInScreenActorRefs = {
    [K in SignInStep]: SnapshotFrom<typeof SignInStateMachine>['children'][K];
} & {
    lostTwoFactor: SnapshotFrom<typeof passwordAccountStateMachine>['children']['lostTwoFactor'];
};

/**
 * Reads the screen actors from their parents, which hold a child until they stop it, even once it finished; xstate's
 * actor system drops an actor as soon as it finishes.
 */
const useScreenActors = (): SignInScreenActorRefs => {
    const { credentials, passwordAccount, sso } = SignInContext.useSelector((snapshot) => snapshot.children);
    const lostTwoFactor = useSelector(passwordAccount, (snapshot) => snapshot?.children.lostTwoFactor);
    return { credentials, passwordAccount, sso, lostTwoFactor };
};

/** Passes the screen through, for routes without a frame. */
const NoFrame = ({ children }: { children: ReactNode }) => <>{children}</>;

/**
 * The sign-in page: the screen the machines are on, inside the page's layout. The current step's route names the actor
 * its screen belongs to; that actor's route picks the screen from its state.
 *
 * Every route's provider wraps the page, in the table's order, each with its own actor or `null`, so the providers and
 * the page stay mounted whatever the screen, and only what's in the page changes. Each screen builds itself from the
 * layout's parts, its heading included, with back as the page offers it. A route's `Frame` stays around its screens
 * while they switch.
 */
export const SignInRoutes = ({ routes }: { routes: SignInRoutesTable }) => {
    const { layout, toApp } = useSignInProps();
    const actors = useScreenActors();
    const step = SignInContext.useSelector(selectStep);
    const stepRoute = routes[step];
    // Each step's route names the deepest actor holding its screens, so one hop from the step is enough
    const screenActor = useSelector(
        actors[step],
        (snapshot) => (snapshot && stepRoute.screenActor?.(snapshot)) ?? step
    );
    const route = routes[screenActor];
    const actorRef = actors[screenActor];

    // Each route's selectors only ever get its own actor's snapshots
    const key = useSelector(actorRef, (snapshot) => snapshot && route.screen(snapshot));
    const Screen = key === undefined ? undefined : route.screens[key];
    const offersBack = useSelector(actorRef, (snapshot) => {
        if (!snapshot) {
            return false;
        }
        const offers = Screen?.offersBack ?? route.offersBack ?? true;
        return typeof offers === 'function' ? offers(snapshot) : offers;
    });
    const { Frame = NoFrame, BeforeMain, BottomRight, decorated = false } = route;

    // Not expected: back or a failure ends a flow in the same transition that moves to the credentials form, and a flow
    // that signed in stays on its screen, loading, until the app takes the sign-in away
    if (!Screen) {
        return null;
    }
    const onBack = offersBack ? () => actorRef?.send({ type: 'decision.back' }) : undefined;

    const page = (
        <layout.Shell
            onBack={onBack}
            beforeMain={BeforeMain ? <BeforeMain /> : undefined}
            bottomRight={BottomRight ? <BottomRight /> : undefined}
            toApp={toApp}
            hasDecoration={decorated}
        >
            <Frame>
                <Screen onBack={onBack} />
            </Frame>
        </layout.Shell>
    );

    return Object.entries(routes).reduceRight<ReactNode>(
        (children, [id, { provider: Provider }]) => (
            <Provider value={actors[id as keyof typeof routes] ?? null}>{children}</Provider>
        ),
        page
    );
};
