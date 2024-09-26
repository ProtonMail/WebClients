import { Fragment, useMemo } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { omit } from '@proton/shared/lib/helpers/object';
import clsx from '@proton/utils/clsx';

import Breadcrumb from './Breadcrumb';
import CollapsedBreadcrumbs from './CollapsedBreadcrumbs';
import type { BreadcrumbInfo } from './interfaces';

export type GroupedBreadcrumbs = (BreadcrumbInfo | BreadcrumbInfo[])[];

interface Props {
    className?: string;
    breadcrumbs: BreadcrumbInfo[];
}

const CollapsingBreadcrumbs = ({ breadcrumbs, className }: Props) => {
    const { viewportWidth } = useActiveBreakpoint();

    const groupedBreadcrumbs = useMemo(
        () =>
            breadcrumbs.reduce((grouped, breadcrumb, i, arr) => {
                // In wider spaces, first breadcrumb is always visible
                if (!viewportWidth.xsmall && i === 0) {
                    return [breadcrumb];
                }

                const secondToLast = arr.length - 2;
                const last = arr.length - 1;

                // Last is always visible, on larger screens also second to last
                if (i === last || (viewportWidth['>=large'] && i === secondToLast)) {
                    return [...grouped, breadcrumb];
                }

                const lastGrouped = grouped.length - 1;
                const group = grouped[lastGrouped];

                // All others are grouped (shown as dropdown)
                return group instanceof Array
                    ? [...grouped.slice(0, lastGrouped), [...group, breadcrumb]]
                    : [...grouped, [breadcrumb]];
            }, [] as GroupedBreadcrumbs),
        [breadcrumbs, viewportWidth.xsmall, viewportWidth['>=large']]
    );

    return (
        <ul className={clsx(['collapsing-breadcrumbs unstyled', className])} data-testid="collapsing-breadcrumbs">
            {groupedBreadcrumbs.map((group, i, arr) => {
                const { key, text, richText, highlighted, ...breadcrumbProps } =
                    group instanceof Array ? group[0] : group;
                const isLast = i === arr.length - 1;

                // Don't group single breadcrumbs, that would look stupid
                return (
                    <Fragment key={key}>
                        {group instanceof Array && group.length > 1 ? (
                            <CollapsedBreadcrumbs breadcrumbs={group} />
                        ) : (
                            <Breadcrumb
                                title={text}
                                {...omit(breadcrumbProps, ['collapsedText'])}
                                active={isLast || highlighted}
                            >
                                {richText || text}
                            </Breadcrumb>
                        )}
                        {!isLast && (
                            <li className="rtl:mirror shrink-0" aria-hidden="true">
                                <Icon size={4} name="chevron-right" />
                            </li>
                        )}
                    </Fragment>
                );
            })}
        </ul>
    );
};

export default CollapsingBreadcrumbs;
