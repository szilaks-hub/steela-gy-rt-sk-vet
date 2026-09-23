import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Paperclip, FileText, ExternalLink, Upload, X, Loader2 } from "lucide-react";

const docName = (url, i) => {
  try {
    const u = new URL(url);
    const name = u.pathname.split("/").pop();
    return name && name.length > 3 ? decodeURIComponent(name) : `Dokumentum ${i + 1}`;
  } catch {
    return `Dokumentum ${i + 1}`;
  }
};

export default function MunkalapDocuments({ munkalap, onUpdated }) {
  const [busy, setBusy] = useState(false);
  const docs = Array.isArray(munkalap.documents) ? munkalap.documents : [];

  const attach = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const updated = await base44.entities.Munkalap.update(munkalap.id, {
        documents: [...docs, file_url],
      });
      onUpdated?.(updated);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (url) => {
    setBusy(true);
    try {
      const updated = await base44.entities.Munkalap.update(munkalap.id, {
        documents: docs.filter((d) => d !== url),
      });
      onUpdated?.(updated);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[0.6875rem] uppercase tracking-wider text-[#86868B] font-semibold inline-flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5" />
          Dokumentumok ({docs.length})
        </p>
        <label className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[#E5E5EA] text-[0.75rem] font-medium text-[#1D1D1F] hover:border-[#FF9500]/50 hover:bg-[#FFF7ED] cursor-pointer transition-colors">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF9500]" /> : <Upload className="w-3.5 h-3.5 text-[#FF9500]" />}
          Csatolás
          <input type="file" className="hidden" onChange={attach} disabled={busy} />
        </label>
      </div>

      <div className="space-y-2">
        {docs.length === 0 && (
          <p className="text-[0.8125rem] text-[#86868B] italic">Nincs csatolt dokumentum</p>
        )}
        {docs.map((url, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-2xl border border-[#EDEDF0] p-2.5 hover:border-[#FF9500]/40 hover:bg-[#FFF7ED] transition-colors group"
          >
            <span className="w-9 h-9 rounded-xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </span>
            <a href={url} target="_blank" rel="noreferrer" className="flex-1 min-w-0 text-[0.8125rem] text-[#1D1D1F] truncate hover:text-[#FF9500]">
              {docName(url, i)}
            </a>
            <a href={url} target="_blank" rel="noreferrer" className="text-[#86868B] group-hover:text-[#FF9500] shrink-0">
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => remove(url)}
              disabled={busy}
              className="text-[#86868B] hover:text-red-500 shrink-0 disabled:opacity-50"
              title="Eltávolítás"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}