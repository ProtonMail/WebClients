import { useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Input } from '@proton/atoms/Input/Input';
import type { IconComponent, SectionConfig, SubSectionConfig, SubrouteConfig } from '@proton/components';
import { AutocompleteList, Marks, Option, useAutocomplete, useAutocompleteFilter } from '@proton/components';
import {
    getIsSectionAvailable,
    getIsSubrouteAvailable,
    getIsSubsectionAvailable,
} from '@proton/components/containers/layout/helper';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { normalize } from '@proton/shared/lib/helpers/string';
import isTruthy from '@proton/utils/isTruthy';

import type { getRoutes } from './routes';

type Routes = ReturnType<typeof getRoutes>;
type RouteParents = keyof Routes;

interface Props {
    routes: Routes;
    app: APP_NAMES;
}

interface SearchOption {
    value: string;
    icon?: IconComponent;
    to: string;
    in: string[];
}

const getAppNameFromParentKey = (parentKey: RouteParents): APP_NAMES => {
    switch (parentKey) {
        case 'calendar':
            return APPS.PROTONCALENDAR;
        case 'mail':
            return APPS.PROTONMAIL;
        case 'drive':
            return APPS.PROTONDRIVE;
        case 'docs':
            return APPS.PROTONDOCS;
        case 'vpn':
            return APPS.PROTONVPN_SETTINGS;
        case 'pass':
            return APPS.PROTONPASS;
        case 'wallet':
            return APPS.PROTONWALLET;
        case 'authenticator':
            return APPS.PROTONAUTHENTICATOR;
    }
    throw new Error('Unknown route');
};

export const getSearchableItems = (routes: Routes, app: APP_NAMES): SearchOption[] => {
    // Titles are collected first and keywords second so that a keyword match never pushes an
    // actual section title out of the result list, which is capped further down the line.
    const titleItems: SearchOption[] = [];
    const keywordItems: SearchOption[] = [];

    Object.entries(routes).forEach(([key, parentRoute]) => {
        const parentKey = key as RouteParents;
        const parentApp = (['account', 'organization', 'msp'] as readonly RouteParents[]).includes(parentKey)
            ? app
            : getAppNameFromParentKey(parentKey);

        if (parentRoute.available === false) {
            return;
        }

        const prefix = parentApp !== APPS.PROTONACCOUNT ? `/${getSlugFromApp(parentApp)}` : '';

        Object.values(parentRoute.routes).forEach((sectionRoute: SectionConfig) => {
            if (!getIsSectionAvailable(sectionRoute)) {
                return;
            }

            // A keyword is dropped when the same section already offers an equivalent entry, so that
            // e.g. the "Compare plans" keyword doesn't duplicate the "Compare plans" subsection title.
            const seen = new Set<string>();
            const addTitle = (item: SearchOption) => {
                seen.add(normalize(item.value, true));
                titleItems.push(item);
            };
            const addKeywords = (keywords: string[] | undefined, item: Omit<SearchOption, 'value'>) => {
                keywords?.forEach((keyword) => {
                    const normalizedKeyword = normalize(keyword, true);
                    if (seen.has(normalizedKeyword)) {
                        return;
                    }
                    seen.add(normalizedKeyword);
                    keywordItems.push({ ...item, value: keyword });
                });
            };

            addTitle({
                value: sectionRoute.text,
                in: [parentRoute.header],
                to: `${prefix}${sectionRoute.to}`,
                icon: sectionRoute.icon,
            });

            (sectionRoute.subsections || []).forEach((subsection: SubSectionConfig) => {
                if (!getIsSubsectionAvailable(subsection)) {
                    return;
                }
                const to = `${prefix}${sectionRoute.to}#${subsection.id}`;
                if (subsection.text) {
                    addTitle({
                        value: subsection.text,
                        in: [parentRoute.header, sectionRoute.text],
                        to,
                        icon: sectionRoute.icon,
                    });
                }
                addKeywords(subsection.keywords, {
                    in: [parentRoute.header, sectionRoute.text, subsection.text].filter(isTruthy),
                    to,
                    icon: sectionRoute.icon,
                });
            });

            const allSubrouteConfigs = [
                ...Object.values<SubrouteConfig>(sectionRoute.subroutes ?? {}),
                ...(Object.values(sectionRoute.subrouteGroups ?? {})?.flatMap((g) => Object.values(g.subroutes)) ?? []),
            ];
            allSubrouteConfigs.filter(getIsSubrouteAvailable).forEach((subroute) => {
                const to = `${prefix}${sectionRoute.to}${subroute.to}`;
                const icon = subroute.icon ?? sectionRoute.icon;
                addTitle({
                    value: subroute.text,
                    in: [parentRoute.header, sectionRoute.text],
                    to,
                    icon,
                });
                addKeywords(subroute.keywords, {
                    in: [parentRoute.header, sectionRoute.text, subroute.text],
                    to,
                    icon,
                });
            });
        });
    });

    return [...titleItems, ...keywordItems];
};

const getData = ({ value }: SearchOption) => value;

export const AutocompleteSettingsSearch = ({
    options,
    onFocus,
    onBlur,
}: {
    options: SearchOption[];
    onFocus?: () => void;
    onBlur?: () => void;
}) => {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const history = useHistory();

    const filteredOptions = useAutocompleteFilter(value, options, getData, 20, 1);

    const handleOption = (option: SearchOption) => {
        history.push(option.to);
        setValue('');
    };

    const { onClose, getOptionID, inputProps, suggestionProps } = useAutocomplete({
        id: 'search-settings',
        options: filteredOptions,
        onSelect: (optionValue) => {
            handleOption(optionValue);
        },
        input: value,
        inputRef,
    });

    return (
        <>
            <div className="searchbox self-center my-auto">
                <Input
                    {...inputProps}
                    onFocus={() => {
                        onFocus?.();
                        inputProps.onFocus();
                    }}
                    onBlur={() => {
                        onBlur?.();
                        inputProps.onBlur();
                    }}
                    placeholder={
                        /** Translator: Translate as the action to search in the settings */
                        c('Action').t`Search settings`
                    }
                    prefix={<IcMagnifier />}
                    className="pl-0"
                    ref={inputRef}
                    containerRef={containerRef}
                    value={value}
                    onChange={(event) => {
                        setValue(event.currentTarget.value.trimStart());
                    }}
                />
            </div>
            <AutocompleteList anchorRef={containerRef.current ? containerRef : inputRef} {...suggestionProps}>
                {filteredOptions.map(({ chunks, text, option }, index) => {
                    const parent = option.in.join(' > ');
                    const IconComponent = option.icon;
                    return (
                        <Option
                            key={`${parent}-${text}-${option.to}`}
                            id={getOptionID(index)}
                            title={text}
                            value={option}
                            disableFocusOnActive
                            onChange={(optionValue) => {
                                handleOption(optionValue);
                                onClose();
                            }}
                        >
                            <div className="flex">
                                {IconComponent ? (
                                    <div className="pr-4">
                                        <IconComponent />
                                    </div>
                                ) : null}
                                <div className="flex-1">
                                    <div>
                                        <Marks chunks={chunks}>{text}</Marks>
                                    </div>
                                    <div className="color-weak text-sm">{parent}</div>
                                </div>
                            </div>
                        </Option>
                    );
                })}
            </AutocompleteList>
        </>
    );
};

const emptyOptions: SearchOption[] = [];

const SettingsSearch = ({ routes, app }: Props) => {
    const [isFocused, setIsFocused] = useState(false);

    // Building the searchable items is relatively expensive, so it's deferred until the search input is focused.
    const options = isFocused ? getSearchableItems(routes, app) : emptyOptions;

    return (
        <AutocompleteSettingsSearch
            options={options}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
        />
    );
};

export default SettingsSearch;
