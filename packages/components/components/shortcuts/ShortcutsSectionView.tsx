import React from 'react';
import { classnames } from '../../helpers';

interface Shortcut {
    name: string;
    keys: string | string[];
}

interface Props {
    name: string;
    shortcuts: Shortcut[];
}

const ShortcutsSectionView = ({ name, shortcuts }: Props) => {
    return (
        <div className="pr2 onmobile-pr0 mb2">
            <h2 className="h5 mb0-5">{name}</h2>
            {shortcuts.length > 0 && (
                <ul className="unstyled mt1 onmobile-pr0 list-2columns-nobreak">
                    {shortcuts.map(({ name, keys }) => (
                        <li key={name} className="flex flex-items-center flex-spacebetween mb0-5">
                            <span>{name}</span>
                            {typeof keys === 'string' ? (
                                <kbd>{keys}</kbd>
                            ) : (
                                <span>
                                    {keys.map((k: string, i: number) => (
                                        <kbd key={`${name} - ${k}`} className={classnames([i > 0 && 'ml0-5'])}>
                                            {k}
                                        </kbd>
                                    ))}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ShortcutsSectionView;
