import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { ProjectIcon } from '../../../components/ProjectIcon/ProjectIcon';
import type { ProtonPlugin } from '../../skills/protonCatalog';

interface ProtonPluginCardProps {
    plugin: ProtonPlugin;
    added: boolean;
    adding: boolean;
    onAdd: () => void;
    onOpen: () => void;
    onPreview: () => void;
}

export const getPluginMeta = (plugin: ProtonPlugin) => {
    const count = plugin.skills.length;
    const author = BRAND_NAME;
    return c('collider_2025:Info').ngettext(
        msgid`${count} skill · by ${author}`,
        `${count} skills · by ${author}`,
        count
    );
};

export const PluginIcon = ({ plugin, large = false }: { plugin: ProtonPlugin; large?: boolean }) => (
    <div
        className={clsx(
            'customize-plugin-icon flex shrink-0 items-center justify-center rounded-xl w-custom h-custom',
            `customize-plugin-icon--${plugin.accent}`
        )}
        style={{ '--w-custom': large ? '3rem' : '2.75rem', '--h-custom': large ? '3rem' : '2.75rem' }}
        aria-hidden
    >
        <ProjectIcon iconId={plugin.icon} size={large ? 24 : 22} />
    </div>
);

export const PluginExample = ({ plugin }: { plugin: ProtonPlugin }) => {
    const example = plugin.getExample();
    return (
        <p className="m-0 flex flex-nowrap items-start gap-2 rounded-lg bg-weak px-3 py-2 text-sm color-weak">
            <LumoIcon name="MessageSquare" size={14} className="shrink-0 mt-0.5" />
            <span className="text-ellipsis-two-lines">{c('collider_2025:Info').t`Try “${example}”`}</span>
        </p>
    );
};

export const ProtonPluginCard = ({ plugin, added, adding, onAdd, onOpen, onPreview }: ProtonPluginCardProps) => {
    const title = plugin.getTitle();

    return (
        <Card
            as="article"
            background={false}
            className="customize-plugin-card relative flex flex-column flex-nowrap gap-4 min-w-0 rounded-xl p-5"
        >
            <div className="flex flex-nowrap items-start gap-3 min-w-0">
                <PluginIcon plugin={plugin} />
                <div className="flex flex-column flex-nowrap flex-1 min-w-0 gap-0.5">
                    <h4 className="m-0 text-rg text-semibold text-ellipsis">
                        <button type="button" className="expand-click-area text-left" onClick={onPreview}>
                            {title}
                        </button>
                    </h4>
                    <span className="text-xs color-weak">
                        {added ? (
                            <span className="inline-flex flex-nowrap items-center gap-1 color-success">
                                <LumoIcon name="Check" size={12} />
                                {c('collider_2025:Info').t`Added`}
                            </span>
                        ) : (
                            getPluginMeta(plugin)
                        )}
                    </span>
                </div>
                <div className="relative z-1 shrink-0">
                    {added ? (
                        <Button shape="ghost" color="weak" size="small" pill onClick={onOpen}>
                            {c('collider_2025:Action').t`Open`}
                        </Button>
                    ) : (
                        <Button
                            shape="outline"
                            color="weak"
                            size="small"
                            pill
                            loading={adding}
                            onClick={onAdd}
                            aria-label={c('collider_2025:Action').t`Add ${title}`}
                        >
                            <span className="flex flex-nowrap items-center gap-1">
                                <LumoIcon name="Plus" size={14} />
                                {c('collider_2025:Action').t`Add`}
                            </span>
                        </Button>
                    )}
                </div>
            </div>

            <p className="m-0 text-sm text-ellipsis-two-lines">{plugin.getDescription()}</p>

            <div className="mt-auto">
                <PluginExample plugin={plugin} />
            </div>
        </Card>
    );
};
