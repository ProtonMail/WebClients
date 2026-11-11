import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { IcLanguage } from '@proton/icons/icons/IcLanguage';
import { getBlogURL } from '@proton/shared/lib/helpers/url';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

import { SettingsIconRow } from '../account/SettingsIconRow';
import SettingsParagraph from '../account/SettingsParagraph';
import { SettingsSelectRow, getSettingsSelectRowLabelId } from '../account/SettingsSelectRow';
import LanguageSelector from './LanguageSelector';

interface Props {
    locales: TtagLocaleMap;
}

/**
 * Sits below the language card rather than inside its row, so it's exported separately
 * for each page that renders {@link LanguageSection} to place itself.
 */
export const LanguageTranslationHelp = () => {
    const helpTranslateLink = (
        <Href key="help-translate" href={getBlogURL('/translation-community')}>
            {c('Link').t`Help translate`}
        </Href>
    );

    return (
        <SettingsParagraph className="mb-0">
            {c('Info').jt`${helpTranslateLink} by joining our localization community.`}
        </SettingsParagraph>
    );
};

const LanguageSection = ({ locales = {} }: Props) => {
    return (
        <SettingsIconRow icon={IcLanguage}>
            <SettingsSelectRow
                id="languageSelect"
                label={<SettingsSelectRow.Label>{c('Label').t`Default language`}</SettingsSelectRow.Label>}
                select={
                    <LanguageSelector
                        id="languageSelect"
                        locales={locales}
                        aria-labelledby={getSettingsSelectRowLabelId('languageSelect')}
                    />
                }
            />
        </SettingsIconRow>
    );
};

export default LanguageSection;
