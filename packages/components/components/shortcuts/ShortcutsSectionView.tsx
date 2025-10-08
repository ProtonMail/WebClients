import { Kbd } from '@proton/atoms/Kbd/Kbd';
import clsx from '@proton/utils/clsx';

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
        <div className="mb-8">
            <h2 className="h5 mb-2">{name}</h2>
            {shortcuts.length > 0 && (
                <ul className="unstyled mt-4">
                    {shortcuts.map(({ name, keys }) => (
                        <li key={name} className="flex items-center md:flex-nowrap justify-space-between mb-2">
                            <span className="mr-1">{name}</span>
                            {typeof keys === 'string' ? (
                                <Kbd shortcut={keys} className="shrink-0" />
                            ) : (
                                <span className="shrink-0">
                                    {keys.map((k: string, i: number) => (
                                        <Kbd key={`${name} - ${k}`} shortcut={k} className={clsx([i > 0 && 'ml-2'])}>
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
