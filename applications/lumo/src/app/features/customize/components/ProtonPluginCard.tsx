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
    onAdd?: () => void;
    /** Shown instead of Add when the user's plan doesn't include skill sets. */
    onUpgrade?: () => void;
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

const PLUGIN_ICON_SIZES = {
    small: { box: '1.75rem', icon: 16, radius: 'rounded-lg' },
    medium: { box: '2.75rem', icon: 22, radius: 'rounded-xl' },
    large: { box: '3rem', icon: 24, radius: 'rounded-xl' },
};

export const PluginIcon = ({
    plugin,
    size = 'medium',
}: {
    plugin: ProtonPlugin;
    size?: keyof typeof PLUGIN_ICON_SIZES;
}) => {
    const { box, icon, radius } = PLUGIN_ICON_SIZES[size];
    return (
        <div
            className={clsx(
                'customize-plugin-icon flex shrink-0 items-center justify-center w-custom h-custom',
                radius,
                `customize-plugin-icon--${plugin.accent}`
            )}
            style={{ '--w-custom': box, '--h-custom': box }}
            aria-hidden
        >
            <ProjectIcon iconId={plugin.icon} size={icon} />
        </div>
    );
};

export const PluginExample = ({ plugin }: { plugin: ProtonPlugin }) => {
    const example = plugin.getExample();
    return (
        <p className="m-0 flex flex-nowrap items-start gap-2 rounded-lg bg-weak px-3 py-2 text-sm color-weak">
            <LumoIcon name="MessageSquare" size={14} className="shrink-0 mt-0.5" />
            <span className="text-ellipsis-two-lines">{c('collider_2025:Info').t`Try “${example}”`}</span>
        </p>
    );
};

export const ProtonPluginCard = ({
    plugin,
    added,
    adding,
    onAdd,
    onUpgrade,
    onOpen,
    onPreview,
}: ProtonPluginCardProps) => {
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
                <div className="flex flex-column flex-nowrap items-end gap-2 shrink-0">
                    <span className="inline-flex flex-nowrap items-center gap-1 rounded-full bg-weak px-2 py-1 text-xs color-weak">
                        <LumoIcon name="Eye" size={14} aria-hidden />
                        {c('collider_2025:Info').t`Preview`}
                    </span>
                    {(added || onAdd || onUpgrade) && (
                        <div className="relative z-1 shrink-0">
                            {added && (
                                <Button shape="ghost" color="weak" size="small" pill onClick={onOpen}>
                                    {c('collider_2025:Action').t`Open`}
                                </Button>
                            )}
                            {!added && !onAdd && onUpgrade && (
                                <Button
                                    shape="outline"
                                    color="norm"
                                    size="small"
                                    pill
                                    onClick={onUpgrade}
                                    aria-label={c('collider_2025:Action').t`Upgrade to add ${title}`}
                                >
                                    <span className="flex flex-nowrap items-center gap-1">
                                        <LumoIcon name="Lock" size={14} />
                                        {c('collider_2025:Action').t`Upgrade`}
                                    </span>
                                </Button>
                            )}
                            {!added && onAdd && (
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
