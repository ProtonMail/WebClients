import JSZip from 'jszip';

import { hasRootSkillMarkdown } from '../skillBundle';
import { decodeText, encodeText, isTextSkillFile } from '../skillFiles';
import { buildSkillMarkdown } from '../skillMarkdown';
import { SKILL_MARKDOWN_PATH, type Skill, type SkillFileDraft } from '../types';

/** A file as shown in the skill editor and viewer. Text files are edited as strings. */
export type WorkspaceFile = {
    path: string;
    mimeType: string;
    text?: string;
    data?: Uint8Array<ArrayBuffer>;
    id?: string;
    createdAt?: string;
};

export const isSkillMarkdown = (file: Pick<WorkspaceFile, 'path'>) => file.path === SKILL_MARKDOWN_PATH;

export const toWorkspaceFile = (file: SkillFileDraft): WorkspaceFile =>
    isTextSkillFile(file.mimeType)
        ? {
              id: file.id,
              createdAt: file.createdAt,
              path: file.path,
              mimeType: file.mimeType,
              text: decodeText(file.data),
          }
        : { ...file };

export const toSkillFileDraft = ({ id, createdAt, path, mimeType, text, data }: WorkspaceFile): SkillFileDraft => ({
    id,
    createdAt,
    path,
    mimeType,
    data: text !== undefined ? encodeText(text) : (data ?? new Uint8Array()),
});

export const sortWorkspaceFiles = (files: WorkspaceFile[]) =>
    [...files].sort((a, b) => {
        if (isSkillMarkdown(a)) return -1;
        if (isSkillMarkdown(b)) return 1;
        return a.path.localeCompare(b.path);
    });

export const getWorkspaceFileSize = (file: WorkspaceFile) =>
    file.text !== undefined ? encodeText(file.text).byteLength : (file.data?.byteLength ?? 0);

/** Rebuilds the bundle in the same layout it is uploaded in, so a download can be re-uploaded. */
export const buildSkillArchive = async (skill: Skill, files: SkillFileDraft[]): Promise<Blob> => {
    const zip = new JSZip();
    if (hasRootSkillMarkdown(skill)) {
        zip.file(SKILL_MARKDOWN_PATH, buildSkillMarkdown(skill));
    }
    for (const file of files) {
        zip.file(file.path, file.data);
    }
    return zip.generateAsync({ type: 'blob' });
};
