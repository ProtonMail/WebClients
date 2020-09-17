import { useCallback } from 'react';

const escape = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

const useAutocompleteRecipient = () => {
    return useCallback(({ label }: { label: string }, input: string) => {
        const trimmed = escape(input.replace(/</gi, '&lt;'));

        const addMark = (s: string | undefined) => s?.replace(new RegExp(trimmed, 'gi'), '<mark>$&</mark>');

        let [name, email] = label.split('<') as [string, string | undefined];
        name = name.trim();
        email = email?.replace('>', '');

        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        li.innerHTML = email ? `${addMark(name)} &lt;${addMark(email)}&gt;` : `${addMark(name)}`;
        li.title = email ? `${name} <${email}>` : `${name}`;

        return li;
    }, []);
};

export default useAutocompleteRecipient;
