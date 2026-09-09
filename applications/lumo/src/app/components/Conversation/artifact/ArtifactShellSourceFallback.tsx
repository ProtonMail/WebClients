interface ArtifactShellSourceFallbackProps {
    content: string;
}

export const ArtifactShellSourceFallback = ({ content }: ArtifactShellSourceFallbackProps) => {
    return (
        <pre className="text-monospace text-sm m-0 p-4 overflow-auto color-norm whitespace-pre-wrap flex-1 w-full h-full">
            {content}
        </pre>
    );
};
