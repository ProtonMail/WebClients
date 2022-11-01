import { Kbd } from '@proton/atoms';

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
        <div className="pr2 on-mobile-pr0 mb2">
            <h2 className="h5 mb0-5">{name}</h2>
            {shortcuts.length > 0 && (
                <ul className="unstyled mt1 on-mobile-pr0 list-2columns-no-break">
                    {shortcuts.map(({ name, keys }) => (
                        <li key={name} className="flex flex-align-items-center flex-justify-space-between mb0-5">
                            <span>{name}</span>
                            {typeof keys === 'string' ? (
                                <Kbd shortcut={keys} />
                            ) : (
                                <span>
                                    {keys.map((k: string, i: number) => (
                                        <Kbd
                                            key={`${name} - ${k}`}
                                            shortcut={k}
                                            className={classnames([i > 0 && 'ml0-5'])}
                                        >
                                            {k}
                                        </Kbd>
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
