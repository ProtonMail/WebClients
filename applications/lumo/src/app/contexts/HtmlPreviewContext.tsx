import { createContext, useContext } from 'react';

interface HtmlPreviewContextValue {
    onPreviewHtml: (html: string) => void;
}

export const HtmlPreviewContext = createContext<HtmlPreviewContextValue>({
    onPreviewHtml: () => {},
});

export const useHtmlPreview = () => useContext(HtmlPreviewContext);
