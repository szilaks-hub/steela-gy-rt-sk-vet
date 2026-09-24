import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2 } from "lucide-react";
import { logAudit } from "@/lib/auditLog";

export default function CommentSection({ munkalapId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const list = await base44.entities.Megjegyzes.filter({ munkalap_id: munkalapId }, "-created_date", 100);
    setComments(list);
  };

  useEffect(() => {
    load();
  }, [munkalapId]);

  const add = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      let author = "Munkatárs";
      try {
        const me = await base44.auth.me();
        author = me.full_name || me.email || author;
      } catch {
        /* ignore */
      }
      await base44.entities.Megjegyzes.create({
        munkalap_id: munkalapId,
        text: text.trim(),
        author_name: author,
      });
      logAudit({ action: "comment", munkalap_id: munkalapId, note: text.trim().slice(0, 140) });
      setText("");
      load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {comments.length === 0 && (
          <p className="text-[0.8125rem] text-[#86868B] italic">Még nincs megjegyzés.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded-xl bg-[#F5F5F7] px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[0.75rem] font-semibold text-[#1D1D1F]">{c.author_name}</span>
              <span className="text-[0.6875rem] text-[#86868B]">
                {new Date(c.created_date).toLocaleDateString("hu-HU", { month: "short", day: "numeric" })}
              </span>
            </div>
            <p className="mt-1 text-[0.8125rem] text-[#1D1D1F] leading-snug whitespace-pre-wrap">{c.text}</p>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add();
          }}
          rows={1}
          placeholder="Megjegyzés írása…"
          className="flex-1 resize-none rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] px-3 py-2.5 text-[0.8125rem] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#FF9500]/50"
        />
        <button
          onClick={add}
          disabled={loading || !text.trim()}
          className="w-10 h-10 shrink-0 rounded-xl bg-[#FF9500] text-white flex items-center justify-center hover:bg-[#FF9500]/90 disabled:opacity-40 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}