import { Clipboard, X } from "lucide-react";
import type { ReportResponse } from "@/lib/types";

interface Props {
  report: ReportResponse | null;
  onClose: () => void;
}

export function ReportPanel({ report, onClose }: Props) {
  if (!report) return null;
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-steel-100 bg-steel-50/80 p-5">
        <div>
          <p className="muted-label">Generated report</p>
          <h2 className="mt-1 text-lg font-bold text-steel-900">{report.title}</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            title="Copy report"
            onClick={() => navigator.clipboard?.writeText(report.markdown)}
            className="control-button h-9 w-9"
          >
            <Clipboard size={16} />
          </button>
          <button
            type="button"
            title="Close report"
            onClick={onClose}
            className="control-button h-9 w-9 hover:border-signal-100 hover:text-signal"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <pre className="max-h-[460px] overflow-auto whitespace-pre-wrap p-5 text-sm leading-6 text-steel-800">
        {report.markdown}
      </pre>
    </section>
  );
}
