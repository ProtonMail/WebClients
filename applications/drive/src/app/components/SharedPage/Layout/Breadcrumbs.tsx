import { useEffect, useState } from 'react';

import { type BreadcrumbInfo, CollapsingBreadcrumbs } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useLinkPathPublic } from '../../../store/_views/useLinkPath';

interface Props {
    token: string;
    name: string;
    linkId: string;
    onNavigate?: (linkId: string) => void;
    className?: string;
}

export default function Breadcrumbs({ token, name, linkId, onNavigate, className }: Props) {
    const { traverseLinksToRoot } = useLinkPathPublic(); // TODO: Get data using usePublicFolderView instead one day.
    const defaultBreadcrumbs: BreadcrumbInfo[] = [
        {
            key: 'default',
            title: name,
            text: name,
            noShrink: true,
        },
    ];
    const [breadcrumbs, setBreadcrumbs] = useState(defaultBreadcrumbs);

    useEffect(() => {
        const abortController = new AbortController();

        traverseLinksToRoot(abortController.signal, token, linkId)
            .then((pathItems) => {
                const breadcrumbs = pathItems.map((item) => {
                    const breadcrumb: BreadcrumbInfo = {
                        key: item.linkId,
                        text: item.name,
                        collapsedText: item.name,
                        onClick: item.linkId === linkId || !onNavigate ? undefined : () => onNavigate(item.linkId),
                    };
                    return breadcrumb;
                });
                setBreadcrumbs(breadcrumbs);
            })
            .catch((err: any) => {
                if (err.name !== 'AbortError') {
                    console.warn(err);
                    setBreadcrumbs(defaultBreadcrumbs);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [traverseLinksToRoot, onNavigate, token, linkId]);

    return <CollapsingBreadcrumbs breadcrumbs={breadcrumbs} className={clsx(['text-4xl', className])} />;
}
