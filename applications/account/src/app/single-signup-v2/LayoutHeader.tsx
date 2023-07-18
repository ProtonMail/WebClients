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
}: {
    languageSelect: boolean;
    hasDecoration?: boolean;
    className?: string;
    onBack?: () => void;
    logo: ReactNode;
}) => {
    return (
        <header
            className={clsx(
                className,
                'flex flex-justify-space-between flex-align-items-center flex-item-noshrink flex-nowrap signup-v2-header gap-1 md:px-8 md:py-6 py-4 px-3'
            )}
        >
            <div className="inline-flex flex-nowrap flex-item-noshrink">
                <div className="no-desktop no-tablet flex-item-noshrink mr-2">
                    {onBack && <BackButton onClick={onBack} />}
                </div>
                <div className="flex-item-noshrink">{logo}</div>
            </div>
            {hasDecoration && languageSelect && <LanguageSelect className="max-w100 ml-4" globe locales={locales} />}
        </header>
    );
};

export default LayoutHeader;
