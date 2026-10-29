import { useId, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import { BRAND_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { ProtonPlugin, ProtonPluginGroup } from '../../skills/protonCatalog';
import { ProtonPluginCard } from './ProtonPluginCard';
import { ProtonPluginPreviewModal } from './ProtonPluginPreviewModal';

interface SkillsDiscoverProps {
    plugins: ProtonPlugin[];
    /** Plugin id → id of the user's copy, for plugins already added. */
    addedSkillIds: ReadonlyMap<string, string>;
    addingId: string | undefined;
    onAdd: (plugin: ProtonPlugin) => void;
    onOpen: (skillId: string) => void;
}

const getGroups = (): { id: ProtonPluginGroup; title: string; description: string }[] => [
    {
        id: 'everyday',
        title: c('collider_2025:Title').t`Everyday`,
        description: c('collider_2025:Info').t`Write, plan, learn and stay safe online.`,
    },
    {
        id: 'work',
        title: c('collider_2025:Title').t`Work`,
        description: c('collider_2025:Info').t`Research, analyze data, build decks, design and ship code.`,
    },
    {
        id: 'business',
        title: c('collider_2025:Title').t`Business and product`,
        description: c('collider_2025:Info').t`Run a small business and decide what to build next.`,
    },
];

const getCatalogueSummary = (plugins: ProtonPlugin[]) => {
    const pluginCount = plugins.length;
    const skillCount = plugins.reduce((total, plugin) => total + plugin.skills.length, 0);
    const pluginText = c('collider_2025:Info').ngettext(
        msgid`${pluginCount} plugin`,
        `${pluginCount} plugins`,
        pluginCount
    );
    const skillText = c('collider_2025:Info').ngettext(msgid`${skillCount} skill`, `${skillCount} skills`, skillCount);
    return `${pluginText} · ${skillText}`;
};

export const SkillsDiscover = ({ plugins, addedSkillIds, addingId, onAdd, onOpen }: SkillsDiscoverProps) => {
    const headingId = useId();
    const previewModal = useModalStateObject();
    const [previewed, setPreviewed] = useState<ProtonPlugin>();
    const [filter, setFilter] = useState<ProtonPluginGroup | 'all'>('all');

    const actionsFor = (plugin: ProtonPlugin) => {
        const skillId = addedSkillIds.get(plugin.id);
        return {
            added: skillId !== undefined,
            adding: addingId === plugin.id,
            onAdd: () => onAdd(plugin),
            onOpen: () => skillId && onOpen(skillId),
        };
    };

    const groups = getGroups();
    const sections = groups
        .filter((group) => filter === 'all' || group.id === filter)
        .map((group) => ({ ...group, plugins: plugins.filter((plugin) => plugin.group === group.id) }))
        .filter((group) => group.plugins.length > 0);

    const filters = [{ id: 'all' as const, title: c('collider_2025:Action').t`All` }, ...groups];

    return (
        <section className="flex flex-column flex-nowrap gap-8" aria-labelledby={headingId}>
            <header className="customize-discover-hero flex flex-column flex-nowrap gap-4 rounded-xl p-6">
                <div className="flex flex-column flex-nowrap gap-2">
                    <span className="text-xs text-semibold text-uppercase color-weak">
                        {getCatalogueSummary(plugins)}
                    </span>
                    <h2 className="m-0 text-3xl text-bold" id={headingId}>
                        {c('collider_2025:Title').t`Plugins from ${BRAND_NAME}`}
                    </h2>
                    <p className="m-0 color-weak max-w-custom" style={{ '--max-w-custom': '36rem' }}>
                        {c('collider_2025:Info')
                            .t`Each plugin adds a set of skills. Use them with / in any chat, or let ${LUMO_SHORT_APP_NAME} pick the right one for you.`}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {filters.map((option) => {
                        const active = filter === option.id;
                        return (
                            <Button
                                key={option.id}
                                size="small"
                                pill
                                shape={active ? 'solid' : 'outline'}
                                color={active ? 'norm' : 'weak'}
                                aria-pressed={active}
                                onClick={() => setFilter(option.id)}
                            >
                                {option.title}
                            </Button>
                        );
                    })}
                </div>
            </header>

            {sections.length === 0 ? (
                <p className="m-0 text-sm color-weak">{c('collider_2025:Info').t`No skills match your search.`}</p>
            ) : (
                sections.map((section) => (
                    <section
                        key={section.id}
                        className="flex flex-column flex-nowrap gap-4"
                        aria-labelledby={`${headingId}-${section.id}`}
                    >
                        <div className="flex flex-column flex-nowrap gap-0.5">
                            <h3 className="m-0 text-lg text-semibold" id={`${headingId}-${section.id}`}>
                                {section.title}
                            </h3>
                            <span className="text-sm color-weak">{section.description}</span>
                        </div>
                        <div className="customize-discover-grid">
                            {section.plugins.map((plugin) => (
                                <ProtonPluginCard
                                    key={plugin.id}
                                    plugin={plugin}
                                    {...actionsFor(plugin)}
                                    onPreview={() => {
                                        setPreviewed(plugin);
                                        previewModal.openModal(true);
                                    }}
                                />
                            ))}
                        </div>
                    </section>
                ))
            )}
            {previewModal.render && previewed && (
                <ProtonPluginPreviewModal {...previewModal.modalProps} plugin={previewed} {...actionsFor(previewed)} />
            )}
        </section>
    );
};
