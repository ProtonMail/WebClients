import type { ComponentType, JSXElementConstructor, ReactNode } from 'react';

import type { AnyActorRef, SnapshotFrom } from 'xstate';

import type { SignInStep } from '../state-machine/SignInStateMachine';
import type { selectScreenActor } from '../steps/password-account/state-machine/passwordAccountStateMachine';

/**
 * The id of an actor whose state picks the screen, which has a route: a step's flow, or the child a flow hands its
 * screens to, like the password step's lost-2FA flow.
 */
export type SignInScreenActor = SignInStep | ReturnType<typeof selectScreenActor>;

/** What the page passes a screen: back, when it offers it, for the screen's heading to show. */
export interface SignInScreenProps {
    onBack?: () => void;
}

/**
 * A screen of the sign-in. It builds itself from the page's layout's parts (`useSignInProps().layout`): its heading
 * first (`layout.Header`), then the rest in its `layout.Body`.
 */
export type SignInScreen = ComponentType<SignInScreenProps> & {
    /**
     * Whether the page offers back, which goes to the machine the screen runs in. Unless this says otherwise, its route
     * decides, and by default it does.
     */
    offersBack?: boolean;
};

/**
 * The screens of one of the sign-in's machines, which one its state is on, and what the page adds around them. Like a
 * route config in a router, the routes are the flow's UI; the machines keep the flow itself.
 */
export interface SignInRoute<TSnapshot, TKey extends PropertyKey = PropertyKey> {
    /**
     * For a step's flow that hands some of its screens to a child: which actor the current screen belongs to, the flow
     * or the child. Its route then picks the screen. By default, the flow's own.
     */
    screenActor?: (snapshot: TSnapshot) => SignInScreenActor;
    screen: (snapshot: TSnapshot) => TKey | undefined;
    screens: Record<TKey, SignInScreen>;
    /** Stays around the route's screens inside the page while they switch, like the anti-abuse challenge. */
    Frame?: ComponentType<{ children: ReactNode }>;
    /** At the top of the page, like an announcement. */
    TopBanner?: ComponentType;
    /** Before the page's main content, like a partner's header. */
    BeforeMain?: ComponentType;
    /** In the page's bottom-right corner, like the Lumo help; the layout shows it with the decoration only. */
    BottomRight?: ComponentType;
    /** The page's decoration (the app logos, footer and help), which only the first step shows. */
    decorated?: boolean;
    /** Whether the page offers back on the route's screens, unless a screen says otherwise. */
    offersBack?: boolean | ((snapshot: TSnapshot) => boolean);
}

/**
 * Provides a route's actor through its context. The page renders every route's provider around the whole page, each
 * with its actor or `null` while it isn't running, so none of them remounts as the sign-in moves between routes.
 */
export type SignInRouteProvider<TActorRef> = JSXElementConstructor<{ value: TActorRef | null; children: ReactNode }>;

/** A route as the page reads it, with the provider of its machine's actor. */
export interface SignInActorRoute extends SignInRoute<unknown> {
    provider: SignInRouteProvider<AnyActorRef>;
}

/** A machine's route: the provider of its actor, and its screens, typed by the actor's snapshot. */
export const signInRoute = <TActorRef extends AnyActorRef | null, TKey extends PropertyKey>(
    route: SignInRoute<SnapshotFrom<NonNullable<TActorRef>>, TKey> & { provider: SignInRouteProvider<TActorRef> }
) =>
    // Stored untyped; the page only passes each route the snapshots of its own actor
    route as unknown as SignInActorRoute;
