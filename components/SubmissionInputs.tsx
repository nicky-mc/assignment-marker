"use client";

import { useRef, useState } from "react";
import { FileText, Link2, Plus, Trash2, Upload } from "lucide-react";
import Alert from "./Alert";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { linkKind, MAX_LABEL_LENGTH, MAX_LINKS, MAX_PARTS } from "@/lib/submissionParts";
import { cn } from "@/lib/utils";

export interface FileEntry {
  id: string;
  fileName: string;
  size: number;
  label: string;
  status: "reading" | "ok" | "failed";
  /** The extracted text. Empty when the file failed. */
  text: string;
  /** Why the file could not be read, or found no text. */
  error?: string;
  warning?: string;
  notice?: string;
}

export interface LinkEntry {
  id: string;
  label: string;
  url: string;
}

const ACCEPT = ".txt,.md,.markdown,.pdf,.docx,.csv,.xlsx,.ods";

// Several files (drag and drop, or the picker) and optional links, each with a label. Files and links are never dropped
// silently: a file that could not be read stays as a card with the reason. The text itself is not shown here.
export default function SubmissionInputs({
  files,
  links,
  suggestions,
  message,
  extracting,
  onAddFiles,
  onRemoveFile,
  onFileLabel,
  onAddLink,
  onRemoveLink,
  onLinkChange,
}: {
  files: FileEntry[];
  links: LinkEntry[];
  /** Short label ideas drawn from the selected assignment. */
  suggestions: string[];
  /** A visible note about files that were not added (too many, too large). */
  message: string | null;
  extracting: boolean;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onFileLabel: (id: string, label: string) => void;
  onAddLink: () => void;
  onRemoveLink: (id: string) => void;
  onLinkChange: (id: string, patch: Partial<Pick<LinkEntry, "label" | "url">>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const listId = "label-suggestions";

  return (
    <div className="flex flex-col gap-4">
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onAddFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "flex flex-col items-start gap-2 rounded-[10px] border-2 border-dashed border-field-border bg-field px-4 py-4 transition-colors duration-150 motion-reduce:transition-none",
          dragging && "border-brand-secondary bg-hover",
        )}
      >
        <p className="text-sm">
          Drop up to {MAX_PARTS} files here, or choose them. Give each a short label so the marker and the AI can tell what is what.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={extracting || files.length >= MAX_PARTS}>
          <Upload aria-hidden="true" />
          {extracting ? "Reading files…" : "Upload files"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          aria-label="Choose files to upload"
          onChange={(e) => {
            onAddFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {message && (
        <Alert variant="warning" title="Some files were not added">
          {message}
        </Alert>
      )}

      {files.length > 0 && (
        <ul className="flex flex-col gap-3" aria-label="Uploaded files">
          {files.map((f, i) => {
            const fid = `file-label-${f.id}`;
            return (
              <li key={f.id} className="flex flex-col gap-2 rounded-[10px] border-2 border-surface-border bg-field px-3 py-3">
                <div className="flex items-start gap-2">
                  <FileText aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                  <p className="min-w-0 flex-1 font-medium break-all">
                    <span className="sr-only">File {i + 1}: </span>
                    {f.fileName}
                  </p>
                  <Button type="button" variant="outline" size="icon-sm" onClick={() => onRemoveFile(f.id)} aria-label={`Remove ${f.fileName}`}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor={fid} className="text-sm font-medium">
                    Label
                  </label>
                  <Input id={fid} value={f.label} maxLength={MAX_LABEL_LENGTH} list={listId} onChange={(e) => onFileLabel(f.id, e.target.value)} />
                </div>
                {f.status === "reading" && <p className="text-sm">Reading this file…</p>}
                {f.status === "failed" && (
                  <p role="alert" className="text-sm font-semibold text-danger">
                    Not included: {f.error ?? "this file could not be read."}
                  </p>
                )}
                {f.status === "ok" && f.warning && <p className="text-sm">Check the text: {f.warning}</p>}
                {f.status === "ok" && f.notice && <p className="text-sm">{f.notice}</p>}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="font-medium">Links (optional)</h3>
        <p className="text-[13px] text-ink-2">
          AssisTED never opens links. Only the label and the kind of site (for example Google Doc, Notion, Canva) are sent for marking. The web address itself is never sent or stored.
        </p>
        {links.length > 0 && (
          <ul className="flex flex-col gap-3" aria-label="Links">
            {links.map((l, i) => {
              const kind = l.url.trim() ? linkKind(l.url) : null;
              const bad = l.url.trim() !== "" && kind === null;
              return (
                <li key={l.id} className="flex flex-col gap-2 rounded-[10px] border-2 border-surface-border bg-field px-3 py-3">
                  <div className="flex items-start gap-2">
                    <Link2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                    <p className="min-w-0 flex-1 font-medium">Link {i + 1}</p>
                    <Button type="button" variant="outline" size="icon-sm" onClick={() => onRemoveLink(l.id)} aria-label={`Remove link ${i + 1}`}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`link-label-${l.id}`} className="text-sm font-medium">
                      Label
                    </label>
                    <Input id={`link-label-${l.id}`} value={l.label} maxLength={MAX_LABEL_LENGTH} list={listId} onChange={(e) => onLinkChange(l.id, { label: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`link-url-${l.id}`} className="text-sm font-medium">
                      Web address
                    </label>
                    <Input
                      id={`link-url-${l.id}`}
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      placeholder="https://"
                      value={l.url}
                      aria-invalid={bad ? true : undefined}
                      aria-describedby={`link-url-note-${l.id}`}
                      onChange={(e) => onLinkChange(l.id, { url: e.target.value })}
                    />
                    <p id={`link-url-note-${l.id}`} className={cn("text-[13px]", bad ? "font-semibold text-danger" : "text-ink-2")} role={bad ? "alert" : undefined}>
                      {bad ? "Enter a web address that starts with https://. This link will not be included until it is fixed." : kind ? `Kind of site: ${kind}` : "Not included until a web address is added."}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div>
          <Button type="button" variant="outline" size="sm" onClick={onAddLink} disabled={links.length >= MAX_LINKS}>
            <Plus aria-hidden="true" />
            Add a link
          </Button>
          {links.length >= MAX_LINKS && <span className="ml-2 text-[13px] text-ink-2">Up to {MAX_LINKS} links.</span>}
        </div>
      </div>
    </div>
  );
}
