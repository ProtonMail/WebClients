import { useMemo, Fragment } from 'react';
import { omit } from '@proton/shared/lib/helpers/object';
import Breadcrumb from './Breadcrumb';
import CollapsedBreadcrumbs from './CollapsedBreadcrumbs';
import useActiveBreakpoint from '../../hooks/useActiveBreakpoint';
import Icon from '../icon/Icon';
import { BreadcrumbInfo } from './interfaces';

export type GroupedBreadcrumbs = (BreadcrumbInfo | BreadcrumbInfo[])[];

interface Props {
    breadcrumbs: BreadcrumbInfo[];
}

const CollapsingBreadcrumbs = ({ breadcrumbs }: Props) => {
    const { isTinyMobile, isDesktop } = useActiveBreakpoint();

    const groupedBreadcrumbs = useMemo(
        () =>
            breadcrumbs.reduce((grouped, breadcrumb, i, arr) => {
                // In wider spaces, first breadcrumb is always visible
                if (!isTinyMobile && i === 0) {
                    return [breadcrumb];
                }

                const secondToLast = arr.length - 2;
                const last = arr.length - 1;

                // Last is always visible, on larger screens also second to last
                if (i === last || (isDesktop && i === secondToLast)) {
                    return [...grouped, breadcrumb];
                }

                const lastGrouped = grouped.length - 1;
                const group = grouped[lastGrouped];

                // All others are grouped (shown as dropdown)
                return group instanceof Array
                    ? [...grouped.slice(0, lastGrouped), [...group, breadcrumb]]
                    : [...grouped, [breadcrumb]];
            }, [] as GroupedBreadcrumbs),
        [breadcrumbs, isTinyMobile, isDesktop]
    );

    return (
        <ul className="collapsing-breadcrumbs">
            {groupedBreadcrumbs.map((group, i, arr) => {
                const { key, text, highlighted, ...breadcrumbProps } = group instanceof Array ? group[0] : group;
                const isLast = i === arr.length - 1;

                // Don't group single breadcrumbs, that would look stupid
                return (
                    <Fragment key={key}>
                        {group instanceof Array && group.length > 1 ? (
                            <CollapsedBreadcrumbs breadcrumbs={group} />
                        ) : (
                            <Breadcrumb {...omit(breadcrumbProps, ['collapsedText'])} active={isLast || highlighted}>
                                {text}
                            </Breadcrumb>
                        )}
                        {!isLast && <Icon size={12} className="flex-item-noshrink" name="angle-down" rotate={270} />}
                    </Fragment>
                );
            })}
        </ul>
    );
};

export default CollapsingBreadcrumbs;
