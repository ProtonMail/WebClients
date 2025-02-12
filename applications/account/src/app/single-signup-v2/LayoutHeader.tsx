import type { ReactNode } from 'react';

import { locales } from '@proton/shared/lib/i18n/locales';
import clsx from '@proton/utils/clsx';

import BackButton from '../public/BackButton';
import LanguageSelect from '../public/LanguageSelect';

const LayoutHeader = ({
    hasDecoration,
    languageSelect,
    onBack,
    logo,
    centerElement,
    className,
    isDarkBg,
}: {
    languageSelect: boolean;
    hasDecoration?: boolean;
    className?: string;
    onBack?: () => void;
    logo: ReactNode;
    centerElement?: ReactNode;
    isDarkBg?: boolean;
}) => {
    return (
        <header
            className={clsx(
                className,
                'flex shrink-0 signup-v2-header w-full mx-auto pt-6 px-6 pb-0 md:pb-6 max-w-custom'
            )}
            style={{ '--max-w-custom': '93.75rem' }}
        >
            <div className="flex w-full justify-space-between items-center gap-1">
                <div className="shrink-0 flex gap-4 flex-column md:flex-row">
                    <div className="inline-flex flex-nowrap gap-2">
                        {onBack && (
                            <div className="md:hidden shrink-0">
                                <BackButton onClick={onBack} />
                            </div>
                        )}
                        <div className="shrink-0">{logo}</div>
                    </div>
                </div>
                {centerElement}

                {hasDecoration && languageSelect && (
                    <LanguageSelect
                        className={clsx('max-w-full ml-4 shrink-0', isDarkBg && 'opacity-70')}
                        globe
                        locales={locales}
                        color={isDarkBg ? 'weak' : 'norm'}
                    />
                )}
            </div>
        </header>
    );
};

export default LayoutHeader;
