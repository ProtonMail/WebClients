interface Props {
    mimeType: string;
}

export const MimeTypeCell = ({ mimeType }: Props) => (
    <div key="mimeType" title={mimeType} className="text-ellipsis">
        <span className="text-pre">{mimeType}</span>
    </div>
);
