import { ReactNode } from 'react';

import { locales } from '@proton/shared/lib/i18n/locales';
import clsx from '@proton/utils/clsx';

import BackButton from '../public/BackButton';
import LanguageSelect from '../public/LanguageSelect';

import './LayoutHeader.scss';

const LayoutHeader = ({
    hasDecoration,
    languageSelect,
    onBack,
    logo,
    className,
    isDarkBg,
}: {
    languageSelect: boolean;
    hasDecoration?: boolean;
    className?: string;
    onBack?: () => void;
    logo: ReactNode;
    isDarkBg?: boolean;
}) => {
    return (
        <header
            className={clsx(
                className,
                'flex justify-space-between items-center shrink-0 flex-nowrap signup-v2-header gap-1 md:px-8 md:py-6 py-4 px-3'
            )}
        >
            <div className="inline-flex flex-nowrap shrink-0">
                <div className="md:hidden shrink-0 mr-2">{onBack && <BackButton onClick={onBack} />}</div>
                <div className="shrink-0">{logo}</div>
            </div>
            {hasDecoration && languageSelect && (
                <LanguageSelect
                    className={clsx('max-w-full ml-4 shrink-0', isDarkBg && 'opacity-70')}
                    globe
                    locales={locales}
                    color={isDarkBg ? 'weak' : 'norm'}
                />
            )}
        </header>
    );
};

export default LayoutHeader;
