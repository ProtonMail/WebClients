import { useState, useMemo } from 'react';
import { Icon, InputTwo, Mark } from '@proton/components';
import iconSvg from '@proton/styles/assets/img/icons/sprite-icons.svg';

import { getTitle } from '../../helpers/title';
import mdx from './Icons.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

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
        <>
            <InputTwo
                placeholder="Seach by name…"
                value={search}
                onChange={({ target: { value } }) => setSearch(value)}
            />
            <div className="icon-grid mt1">
                {iconResults.map((iconName: string) => (
                    <div className="border rounded text-center p1" key={iconName}>
                        <Icon name={iconName} size={40} />
                        <code className="block mt1 user-select">
                            <Mark value={search}>{iconName}</Mark>
                        </code>
                    </div>
                ))}
            </div>
        </>
    );
};
