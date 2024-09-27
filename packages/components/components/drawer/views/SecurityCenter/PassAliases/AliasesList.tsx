import { c } from 'ttag';

import { Card } from '@proton/atoms';
import Copy from '@proton/components/components/button/Copy';
import Info from '@proton/components/components/link/Info';
import { useNotifications } from '@proton/components/hooks';
import type { PassBridgeAliasItem } from '@proton/pass/lib/bridge/types';

import DrawerAppHeadline from '../../shared/DrawerAppHeadline';

type FilteredAlias = { name: string; alias: string };
const getFilteredAliases = (items: PassBridgeAliasItem[]): FilteredAlias[] => {
    return items.reduce<FilteredAlias[]>((acc, item) => {
        const alias = item.item.aliasEmail;
        const name = item.item.data.metadata.name;

        if (alias) {
            acc.push({ name, alias });
        }

        return acc;
    }, []);
};

interface Props {
    items: PassBridgeAliasItem[];
}

const PassAliasesList = ({ items }: Props) => {
    const { createNotification } = useNotifications();
    const aliases = getFilteredAliases(items).slice(0, 3);

    const handleCopy = () => {
        createNotification({
            text: c('Success').t`Alias copied to clipboard`,
        });
    };

    return (
        <>
            <DrawerAppHeadline className="mb-1">
                {c('Security Center').t`Hide-my-email aliases`}{' '}
                <Info className="mb-1" title={c('Success').t`Last modified aliases stored in your oldest vault`} />
            </DrawerAppHeadline>
            <div className="flex flex-column flex-nowrap gap-y-2 max-w-full">
                {aliases.map(({ alias, name }) => (
                    <Card
                        rounded
                        key={alias}
                        padded={false}
                        data-testid="pass-aliases-item"
                        className="relative p-3 border-weak flex flex-nowrap items-center"
                    >
                        <div className="flex-1 pr-2">
                            <span className="block color-weak text-ellipsis" title={name}>
                                {name}
                            </span>
                            <span className="block text-ellipsis flex-1" title={alias}>
                                {alias}
                            </span>
                        </div>
                        <Copy
                            data-testid="pass-aliases-item:copy-button"
                            size="small"
                            shape="ghost"
                            value={alias}
                            className="shrink-0 expand-click-area"
                            onCopy={handleCopy}
                        />
                    </Card>
                ))}
            </div>
        </>
    );
};

export default PassAliasesList;
