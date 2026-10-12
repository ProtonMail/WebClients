import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { CreationListRow } from './CreationListRow';
import { useGeneratedGalleryCreations } from './hooks/useGeneratedGalleryCreations';

import '../gallery/GalleryView.scss';
import './CreationsView.scss';

export const CreationsView = () => {
    const { sections, status } = useGeneratedGalleryCreations();
    const hasItems = sections.some((section) => {
        return section.items.length > 0;
    });

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }}>
            <div className="gallery-view flex flex-column flex-1 min-h-0">
                <div className="gallery-created-scroll flex-1 min-h-0 overflow-auto">
                    <div className="gallery-inner">
                        <header className="creations-page-header">
                            <h1 className="text-2xl text-bold m-0">{c('collider_2025:Title').t`Creations`}</h1>
                            <p className="text-sm color-weak m-0 mt-2">
                                {c('collider_2025:Info')
                                    .t`Documents and other artifacts saved from your conversations.`}
                            </p>
                        </header>

                        {status === 'loading' && (
                            <div className="flex items-center justify-center py-12">
                                <CircleLoader />
                            </div>
                        )}

                        {status === 'error' && (
                            <p className="color-danger text-sm">{c('collider_2025:Error')
                                .t`Could not load creations.`}</p>
                        )}

                        {status === 'loaded' && !hasItems && (
                            <p className="color-weak text-sm">{c('collider_2025:Info').t`No saved creations yet.`}</p>
                        )}

                        {sections.map((section) => {
                            return (
                                <section key={section.label} className="creations-section">
                                    <h2 className="creations-section-title text-sm text-bold color-weak">
                                        {section.label}
                                    </h2>
                                    <div className="flex flex-column gap-0">
                                        {section.items.map((item) => {
                                            return (
                                                <CreationListRow
                                                    key={item.localId}
                                                    attachmentId={item.localId}
                                                    editedAt={item.createdAt}
                                                />
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </div>
            </div>
        </LumoLayoutWithDrawer>
    );
};
