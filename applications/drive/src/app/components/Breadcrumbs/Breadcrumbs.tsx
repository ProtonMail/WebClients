import React, { useMemo } from 'react';
import Breadcrumb from './Breadcrumb';
import { useActiveBreakpoint, Icon } from 'react-components';
import GroupedBreadcrumb from './GroupedBreadcrumb';

export interface BreadcrumbInfo {
    name: string;
    key: string | number;
    onClick: () => void;
}
type GroupedBreadcrumbs = (BreadcrumbInfo | BreadcrumbInfo[])[];

interface Props {
    breadcrumbs: BreadcrumbInfo[];
}

const Breadcrumbs = ({ breadcrumbs }: Props) => {
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
        <ul className="pd-breadcrumbs">
            {groupedBreadcrumbs.map((group, i, arr) => {
                const breadcrumb = group instanceof Array ? group[0] : group;
                const isLast = i === arr.length - 1;

                // Don't group single breadcrumbs, that would look stupid
                return (
                    <>
                        {group instanceof Array && group.length > 1 ? (
                            <GroupedBreadcrumb key={`group_${i}`} breadcrumbs={group} />
                        ) : (
                            <Breadcrumb key={breadcrumb.key} onClick={breadcrumb.onClick} active={isLast}>
                                {breadcrumb.name}
                            </Breadcrumb>
                        )}
                        {!isLast && (
                            <Icon size={12} className="opacity-50 flex-item-noshrink" name="caret" rotate={270} />
                        )}
                    </>
                );
            })}
        </ul>
    );
};

export default Breadcrumbs;
