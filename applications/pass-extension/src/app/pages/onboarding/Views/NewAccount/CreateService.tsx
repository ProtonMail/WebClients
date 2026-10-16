import type { FormEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import Autocomplete from '@proton/components/components/autocomplete/Autocomplete';
import { useAutocompleteFilter } from '@proton/components/components/autocomplete/useAutocomplete';
import Marks from '@proton/components/components/text/Marks';
import { IcArrowRight } from '@proton/icons/icons/IcArrowRight';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { useOnline } from '@proton/pass/components/Core/ConnectivityProvider';
import { ItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { Layout } from '@proton/pass/components/Onboarding/Layout/Layout';
import { OnboardingButton } from '@proton/pass/components/Onboarding/UI/OnboardingButton';
import type { MaybeNull } from '@proton/pass/types';

import type { RemoteService } from './CreateProvider';
import { useCreateContext } from './CreateProvider';
import { Header } from './Header';

import './CreateService.scss';

const SUGGESTIONS_LIMIT = 8;
const getServiceTitle = ({ title }: RemoteService) => title;

export const CreateService = () => {
    const history = useHistory();

    const { services, fetchServices, setState, service } = useCreateContext();
    const online = useOnline();

    const [inputValue, setInputValue] = useState(service?.title ?? '');
    const [selected, setSelected] = useState<MaybeNull<RemoteService>>(service);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const matches = useAutocompleteFilter(inputValue, services, getServiceTitle, SUGGESTIONS_LIMIT);
    const noMatch = services.length > 0 && inputValue.length > 0 && matches.length === 0;

    useEffect(() => {
        if (online && services.length === 0) void fetchServices();
    }, [online]);

    const handleChange = (value: string) => {
        setInputValue(value);
        setSelected(null);
    };

    /** `Autocomplete` forwards the raw input string when Enter is pressed
     * without a highlighted suggestion. Only known services are accepted. */
    const handleSelect = (value: RemoteService | string) => {
        const match = typeof value === 'string' ? (services.find(({ title }) => title === value) ?? null) : value;
        if (match) setInputValue(match.title);
        setSelected(match);
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!selected) return;
        setState((state) => ({ ...state, service: selected }));
        history.push('/create/password');
    };

    /** `Autocomplete` swallows Enter to pick a suggestion and calls
     * `preventDefault`, so implicit form submission never happens. Submitting
     * from the bubbled event lets a second Enter confirm the selection: on the
     * first one `selected` is still the pre-selection value. */
    const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
        if (event.key === 'Enter') handleSubmit(event);
    };

    return (
        <Layout>
            <div className="flex flex-column w-full lg:w-2/3 items-center">
                <Header
                    title={c('Title').t`Create your first login`}
                    subtitle={c('Title').t`Which service do you want to create the login for?`}
                />
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the handler
                    only reacts to Enter bubbling up from the input, and the submit button exposes the same action */}
                <form
                    className="flex flex-row pt-8 gap-4 onboarding-autocomplete min-w-2/3 justify-center items-center"
                    onSubmit={handleSubmit}
                    onKeyDown={handleKeyDown}
                >
                    <label className="flex flex-column flex-1 p-4 text-lg">
                        <span className="px-2 py-1">{c('Label').t`Service`}</span>
                        <Autocomplete<RemoteService>
                            id="service"
                            value={inputValue}
                            onChange={handleChange}
                            onSelect={handleSelect}
                            getData={getServiceTitle}
                            options={services}
                            limit={SUGGESTIONS_LIMIT}
                            renderOption={(s, chunks) => (
                                <div className="flex flex-row gap-2 items-center">
                                    <ItemIcon alt="" icon={IcGlobe} url={s.urls[0]} size={4} loadImage />
                                    <span>
                                        <Marks chunks={chunks}>{s.title}</Marks>
                                    </span>
                                </div>
                            )}
                            suggestionsRef={suggestionsRef}
                            dropdownClassName="onboarding-autocomplete-suggestions"
                            placeholder={c('Placeholder').t`E.g.: Google`}
                        />
                    </label>
                    <OnboardingButton
                        color="norm"
                        icon
                        size="large"
                        className="w-12"
                        disabled={selected === null}
                        type="submit"
                    >
                        <IcArrowRight size={8} />
                    </OnboardingButton>
                </form>
                <div className="mt-4 w-2/3" ref={suggestionsRef}>
                    {noMatch && (
                        <span className="color-weak">{c('Info').t`No matching service. Try a different name.`}</span>
                    )}
                </div>
            </div>
        </Layout>
    );
};
