import { useEffect, useState } from 'react';

import { CollapsingBreadcrumbs } from '@proton/components';
import { BreadcrumbInfo } from '@proton/components/components/collapsingBreadcrumbs/interfaces';

import { useLinkPathPublic } from '../../store/_views/useLinkPath';

interface Props {
    token: string;
    name: string;
    linkId: string;
    setLinkId: (linkId: string) => void;
}

export default function SharedPageBreadcrumb({ token, name, linkId, setLinkId }: Props) {
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
                        onClick: item.linkId === linkId ? undefined : () => setLinkId(item.linkId),
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
    }, [traverseLinksToRoot, setLinkId, token, linkId]);

    return <CollapsingBreadcrumbs breadcrumbs={breadcrumbs} />;
}
