import type { ComponentProps, ReactNode } from 'react';

import { c } from 'ttag';

import { CollapsibleGroup } from '@proton/components/components/collapsible/CollapsibleGroup';

type CollapsibleGroupChildren = ComponentProps<typeof CollapsibleGroup>['children'];

interface RootProps {
    children: ReactNode;
}

/**
 * Layout shell for one platform's deployment instructions.
 *
 * The parts are pure layout slots.
 * None of them share state, so a platform can arrange, omit or repeat them freely.
 *
 * @example
 * ```tsx
 * <Instructions.Root>
 *   <Instructions.Intro>Install the profile on every device.</Instructions.Intro>
 *   <Instructions.Notice>Requires desktop 5.3.0 or later.</Instructions.Notice>
 *   <Instructions.Methods>
 *     <Collapsible key="mdm">…</Collapsible>
 *   </Instructions.Methods>
 * </Instructions.Root>
 * ```
 */
function Root({ children }: RootProps) {
    return <div className="flex flex-column gap-1">{children}</div>;
}
Root.displayName = 'Instructions.Root';

interface IntroProps {
    children: ReactNode;
}

/** Lead paragraph describing what the platform needs for the profile to take effect. */
function Intro({ children }: IntroProps) {
    return <p className="m-0">{children}</p>;
}
Intro.displayName = 'Instructions.Intro';

interface NoticeProps {
    children: ReactNode;
}

/** Secondary, de-emphasised line — caveats and prerequisites that qualify the {@link Intro}. */
function Notice({ children }: NoticeProps) {
    return <p className="m-0 text-sm color-weak">{children}</p>;
}
Notice.displayName = 'Instructions.Notice';

interface MethodsProps {
    /** Must be `Collapsible` components — one per deployment method, each with a `key`. */
    children: CollapsibleGroupChildren;
}

/** The deployment methods on offer, as an accordion where only one method is open at a time. */
function Methods({ children }: MethodsProps) {
    return (
        <div className="flex flex-column gap-4 mt-3">
            <h3 className="text-semibold">{c('Title').t`Choose a deployment method`}</h3>
            <CollapsibleGroup defaultValue="mdm">{children}</CollapsibleGroup>
        </div>
    );
}
Methods.displayName = 'Instructions.Methods';

export const Instructions = { Root, Intro, Notice, Methods };
