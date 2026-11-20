import type { ReactNode } from 'react';
import { useState } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Collapsible } from '@proton/atoms/Collapsible/Collapsible';
import { CollapsibleContent } from '@proton/atoms/Collapsible/CollapsibleContent';
import { CollapsibleHeader } from '@proton/atoms/Collapsible/CollapsibleHeader';
import { CollapsibleHeaderIconButton } from '@proton/atoms/Collapsible/CollapsibleHeaderIconButton';
import { Href } from '@proton/atoms/Href/Href';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { Kbd } from '@proton/atoms/Kbd/Kbd';
import { Scroll } from '@proton/atoms/Scroll/Scroll';
import { Vr } from '@proton/atoms/Vr/Vr';
import Info from '@proton/components/components/link/Info';
import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import Loader from '@proton/components/components/loader/Loader';
import TextLoader from '@proton/components/components/loader/TextLoader';
import CircularProgress from '@proton/components/components/progress/CircularProgress';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';

import { Catalog, ComponentName } from './ComponentGallery';
import type { Appearance } from './ThemeScope';
import { ThemeStyles, scopeClass } from './ThemeScope';

function Example({
    code,
    usage,
    children,
}: {
    code: string;
    usage: string;
    children: ReactNode | ((appearance: Appearance) => ReactNode);
}) {
    return (
        <Catalog>
            {(appearance) => (
                <>
                    <ComponentName design={usage} code={code} />
                    <div className="flex flex-wrap items-center gap-3 w-full">
                        {typeof children === 'function' ? children(appearance) : children}
                    </div>
                </>
            )}
        </Catalog>
    );
}

function Loading() {
    return (
        <>
            <Example code="SkeletonLoader" usage="Question and schedule cards">
                <output className="flex flex-column gap-3 w-full" aria-label="Loading content">
                    <SkeletonLoader width="100%" height="1rem" index={0} />
                    <SkeletonLoader width="85%" height="1rem" index={1} />
                    <SkeletonLoader width="65%" height="1rem" index={2} />
                    <SkeletonLoader width="100%" height="4rem" index={3} />
                </output>
            </Example>
            <Example code="CircleLoader · Loader" usage="Search, library, projects, schedules, and upsell loading">
                <CircleLoader size="small" />
                <CircleLoader size="medium" />
                <Loader size="medium" className="flex p-4" />
            </Example>
            <Example code="EllipsisLoader · TextLoader" usage="Skill lists, connector lists, and app startup">
                <span>
                    Loading skills
                    <EllipsisLoader />
                </span>
                <TextLoader>Loading Lumo</TextLoader>
            </Example>
            <Example code="CircularProgress" usage="Attachment upload progress">
                {[0, 25, 75, 100].map((progress) => (
                    <div key={progress} className="flex flex-column items-center gap-2">
                        <CircularProgress progress={progress} size={28} />
                        <span>{progress}%</span>
                    </div>
                ))}
            </Example>
        </>
    );
}

function Layout() {
    return (
        <>
            <Example
                code="Collapsible · CollapsibleHeader · CollapsibleHeaderIconButton · CollapsibleContent"
                usage="Skill upload details"
            >
                <Collapsible className="w-full">
                    <CollapsibleHeader
                        suffix={
                            <CollapsibleHeaderIconButton>
                                <IcChevronDown />
                            </CollapsibleHeaderIconButton>
                        }
                    >
                        Skill details
                    </CollapsibleHeader>
                    <CollapsibleContent>
                        <p className="py-3">Instructions and attached files for this skill.</p>
                    </CollapsibleContent>
                </Collapsible>
            </Example>
            <Example code="Scroll" usage="Sidebar, skill picker, and question cards">
                <div className="w-full h-custom" style={{ '--h-custom': '10rem' }}>
                    <Scroll scrollContained>
                        {Array.from({ length: 12 }, (_, index) => (
                            <div key={index} className="py-2">
                                Conversation {index + 1}
                            </div>
                        ))}
                    </Scroll>
                </div>
            </Example>
            <Example code="Vr" usage="Customize page header separator">
                <span>Skills</span>
                <Vr className="h-custom" style={{ '--h-custom': '1.5rem' }} />
                <span>Connectors</span>
            </Example>
        </>
    );
}

function SpotlightExample({ appearance }: { appearance: Appearance }) {
    const [show, setShow] = useState(false);
    return (
        <Spotlight
            show={show}
            onClose={() => setShow(false)}
            className={scopeClass(appearance)}
            content="Edit and revise your creation here."
            originalPlacement="bottom"
        >
            <Button onClick={() => setShow(!show)}>Show feature hint</Button>
        </Spotlight>
    );
}

function LinksExample() {
    const [expanded, setExpanded] = useState(false);
    return (
        <>
            <Href href="https://proton.me/lumo">About Lumo</Href>
            <InlineLinkButton onClick={() => setExpanded(!expanded)}>Show details</InlineLinkButton>
            {expanded && <span>Example inline details.</span>}
        </>
    );
}

function Information() {
    return (
        <>
            <Example code="Kbd" usage="Sidebar keyboard shortcuts">
                <Kbd shortcut="⌘ K" />
                <Kbd shortcut="⌘ J" />
            </Example>
            <Example code="Info" usage="Paper trail report explanations">
                {(appearance) => (
                    <>
                        <Info title="Details about this report" tooltipClassName={scopeClass(appearance)} />
                        <Info questionMark title="How this report works" tooltipClassName={scopeClass(appearance)} />
                    </>
                )}
            </Example>
            <Example code="Spotlight" usage="Artifact panel feature discovery">
                {(appearance) => <SpotlightExample appearance={appearance} />}
            </Example>
            <Example code="Href · InlineLinkButton" usage="Source links, legal links, and inline upgrade actions">
                {() => <LinksExample />}
            </Example>
        </>
    );
}

export function OtherProtonComponents({ group }: { group: 'Loading' | 'Layout' | 'Information' }) {
    return (
        <div className="sb-unstyled">
            <ThemeStyles />
            <section className="ds-section">
                {group === 'Loading' && <Loading />}
                {group === 'Layout' && <Layout />}
                {group === 'Information' && <Information />}
            </section>
        </div>
    );
}
