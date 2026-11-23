interface ArtifactShellSourceFallbackProps {
    content: string;
}

export const ArtifactShellSourceFallback = ({ content }: ArtifactShellSourceFallbackProps) => {
    return (
        <pre className="whitespace-pre-wrap flex-1 w-full h-full m-0 p-4 overflow-auto lumo-body-small lumo-font-mono lumo-color-glyph">
            {content}
        </pre>
    );
};
