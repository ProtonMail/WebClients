import type { BreadcrumbInfo } from '@proton/components/index';
import { CollapsingBreadcrumbs, Loader } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

import { SignatureIcon } from '../../components/SignatureIcon';
import type { BreadcrumbsEvents, CrumbDefinition } from './types';
import { BreadcrumbRenderingMode } from './types';

export interface BreadcrumbsProps {
    loading: boolean;
    crumbs: CrumbDefinition[];
    events: BreadcrumbsEvents;
    renderingMode?: BreadcrumbRenderingMode;
}

export const Breadcrumbs = ({
    crumbs,
    loading,
    events,
    renderingMode = BreadcrumbRenderingMode.Inline,
}: BreadcrumbsProps) => {
    if (loading) {
        return <Loader className="py-2 px-3" />;
    }
    const breadcrumbs: BreadcrumbInfo[] = crumbs.map((crumb) => {
        const nodeUid = crumb.uid;
        return {
            key: crumb.uid,
            text: crumb.name,
            richText: (
                <span className="flex items-center flex-nowrap flex-1">
                    {!crumb.haveSignatureIssues && (
                        <SignatureIcon haveSignatureIssues={crumb.haveSignatureIssues} isFile={false} />
                    )}
                    <span className="text-pre text-ellipsis">{crumb.name}</span>
                </span>
            ),
            noShrink: true, // Keep root (My files) to be always fully visible.
            collapsedText: crumb.name,
            onClick: () => events.onBreadcrumbItemClick(nodeUid),

            // TODO: Implement DnD
            highlighted: false,
            onDragLeave: () => {},
            onDragOver: () => {},
            onDrop: async () => {},
        };
    });

    const isProminent = renderingMode === BreadcrumbRenderingMode.Prominent;
    return <CollapsingBreadcrumbs className={clsx(isProminent && 'text-4xl')} breadcrumbs={breadcrumbs} />;
};
