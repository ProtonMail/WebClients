import { useState, useMemo } from 'react';
import { Icon, Input, Mark } from '@proton/components';
import iconSvg from '@proton/styles/assets/img/icons/sprite-icons.svg';
import { getTitle } from '../../helpers/title';

export default { component: Icon, title: getTitle(__filename) };

export const PrimaryIcons = () => {
    const primaryIconNames: string[] = iconSvg.match(/id="ic-([^"]+)/g).map((x: string) => x.replace('id="ic-', ''));
    const [search, setSearch] = useState('');
    const iconResults = useMemo(() => {
        if (search.length <= 1) {
            return primaryIconNames;
        }
        return primaryIconNames.filter((x) => x.toLowerCase().includes(search.toLocaleLowerCase()));
    }, [search]);
    return (
        <div>
            <Input placeholder="Name..." value={search} onChange={({ target: { value } }) => setSearch(value)} />
            <div className="flex mb2">
                {iconResults.map((iconName: string) => (
                    <div className="w200p text-center p1" key={iconName}>
                        <Icon name={iconName} size={24} />
                        <code className="block mt0-5">
                            <Mark value={search}>{iconName}</Mark>
                        </code>
                    </div>
                ))}
            </div>
        </div>
    );
};
