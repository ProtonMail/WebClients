import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './HidingDisablingContent.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Hidden = () => (
    <div className="p-7 bg-weak">
        Here are two hidden elements:
        <p hidden>I'm hidden</p>
        <p className="hidden">I'm also hidden</p>
    </div>
);

export const HiddenEmpty = () => (
    <div className="p-7 bg-weak">
        Here are two elements, one empty, one not empty:
        <p className="hidden-empty m-0">I'm not empty</p>
        <p className="hidden-empty m-0">{/* I'm empty */}</p>
    </div>
);

export const VisibilityHidden = () => (
    <div className="p-7 bg-weak">
        Here is one hidden element
        <span className="visibility-hidden">I'm hidden but still need my space</span>
        which still keeps its space
    </div>
);

export const Screenreaders = () => (
    <div className="p-7 bg-weak">
        <Button>
            <Icon name="emoji" />
            <span className="sr-only">I'm hidden but will can vocalized when using a screen reader</span>
        </Button>
    </div>
);

export const PointerEventsNone = () => (
    <div className="p-7 bg-weak">
        <Button className="no-pointer-events mr-8">Hover me (no-pointer-events)</Button>
        <Button>Hover me (default)</Button>
    </div>
);
{
    /*

<div class="flex justify-space-between mb-8 flex-column md:flex-row">
    <div class="w-1/2 self-center">
        Applies <code>pointer-events: none</code> to element.
        <br />
        If you need to remove pointer events on all children of an element, you may use{' '}
        <code>no-pointer-events-children</code> class.
    </div>
    <div class="w-1/2">
        <Source
            language="html"
            light
            format
            code={`
<a className="no-pointer-events">Lorem ipsum dolor</a>
`}
        />
    </div>
</div> */
}
