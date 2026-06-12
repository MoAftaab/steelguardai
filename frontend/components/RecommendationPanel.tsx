import { AlertTriangle, Brain, Check, FileText, MessageSquare, RotateCcw, ShieldAlert, Target, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { FeedbackPayload, FeedbackRating, Recommendation } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";

interface Props {
  recommendation: Recommendation | null;
  onReport: () => void;
  onFeedback: (payload: FeedbackPayload) => Promise<void> | void;
  busy?: boolean;
}

interface ReviewFormState {
  actualRootCause: string;
  actionTaken: string;
  downtimeSavedMinutes: string;
  note: string;
}

const emptyReviewForm: ReviewFormState = {
  actualRootCause: "",
  actionTaken: "",
  downtimeSavedMinutes: "",
  note: ""
};

function metadataText(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function formatMode(value: string) {
  return value.replaceAll("_", " ");
}

export function RecommendationPanel({ recommendation, onReport, onFeedback, busy }: Props) {
  const [feedbackBusy, setFeedbackBusy] = useState<FeedbackRating | null>(null);
  const [feedbackState, setFeedbackState] = useState<FeedbackRating | null>(null);
  const [reviewMode, setReviewMode] = useState<Extract<FeedbackRating, "corrected" | "rejected"> | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>(emptyReviewForm);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    setFeedbackBusy(null);
    setFeedbackState(null);
    setReviewMode(null);
    setReviewForm(emptyReviewForm);
    setReviewError(null);
  }, [recommendation?.id]);

  if (!recommendation) {
    return (
      <div className="panel border-dashed border-white/[0.1] p-6 text-sm text-slate-500">
        Waiting for maintenance analysis.
      </div>
    );
  }

  function payloadFor(rating: FeedbackRating, form: ReviewFormState): FeedbackPayload {
    if (!recommendation) {
      throw new Error("Recommendation is not ready.");
    }
    const minutes = Number.parseInt(form.downtimeSavedMinutes, 10);
    return {
      recommendation_id: recommendation.id,
      equipment_id: recommendation.equipment_id,
      rating,
      actual_root_cause: form.actualRootCause.trim() || undefined,
      action_taken: form.actionTaken.trim() || undefined,
      downtime_saved_minutes: Number.isFinite(minutes) && minutes > 0 ? minutes : 0,
      note: form.note.trim() || undefined
    };
  }

  async function saveFeedback(rating: FeedbackRating, form: ReviewFormState) {
    if (feedbackBusy) return;
    setFeedbackBusy(rating);
    setReviewError(null);
    try {
      await onFeedback(payloadFor(rating, form));
      setFeedbackState(rating);
      setReviewMode(null);
      setReviewForm(emptyReviewForm);
    } catch {
      setFeedbackState(null);
    } finally {
      setFeedbackBusy(null);
    }
  }

  async function acceptRecommendation() {
    if (!recommendation) return;
    await saveFeedback("accepted", {
      actualRootCause: recommendation.probable_root_causes[0] ?? "",
      actionTaken: recommendation.immediate_actions[0] ? `Accepted plan: ${recommendation.immediate_actions[0]}` : "Accepted recommendation plan",
      downtimeSavedMinutes: "",
      note: "Recommendation accepted from the maintenance review panel."
    });
  }

  function openReview(mode: Extract<FeedbackRating, "corrected" | "rejected">) {
    setReviewMode(mode);
    setReviewError(null);
    setReviewForm(emptyReviewForm);
  }

  function updateReviewField(field: keyof ReviewFormState, value: string) {
    setReviewForm((current) => ({ ...current, [field]: value }));
  }

  async function submitReview() {
    if (!reviewMode) return;
    const hasOutcome =
      reviewForm.actualRootCause.trim() ||
      reviewForm.actionTaken.trim() ||
      reviewForm.note.trim();
    if (!hasOutcome) {
      setReviewError(reviewMode === "corrected" ? "Add the corrected root cause, action taken, or note." : "Add the rejection reason or a note.");
      return;
    }
    await saveFeedback(reviewMode, reviewForm);
  }

  return (
    <section className="space-y-4">
      <div className="panel overflow-hidden p-5">
        <div className="mb-4 h-1 rounded-full bg-gradient-to-r from-coolant via-purple-500 to-signal" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="muted-label">Agentic recommendation</p>
            <h2 className="mt-1 text-lg font-bold text-white">Alert-to-action plan</h2>
          </div>
          <div className="flex items-center gap-2">
            <RiskBadge risk={recommendation.risk_level} />
            <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs font-semibold text-slate-300">
              RUL {recommendation.rul_estimate.hours}h
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">{recommendation.diagnosis}</p>
      </div>

      {recommendation.ml_prediction && (
        <div className="panel-soft p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Brain size={17} className="text-purple-400" />
                ML failure classifier
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {recommendation.ml_prediction.model_name} - validation accuracy {Math.round(recommendation.ml_prediction.validation_accuracy * 100)}%
              </p>
            </div>
            <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${
              recommendation.ml_prediction.failure_likely
                ? "bg-red-500/15 text-red-400"
                : "bg-emerald-500/15 text-emerald-400"
            }`}>
              {Math.round(recommendation.ml_prediction.failure_probability * 100)}% failure probability
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.1]">
            <div
              className={recommendation.ml_prediction.failure_likely ? "h-full rounded-full bg-red-500" : "h-full rounded-full bg-coolant"}
              style={{ width: `${Math.max(6, Math.round(recommendation.ml_prediction.failure_probability * 100))}%` }}
            />
          </div>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <div className="card-muted p-3">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Target size={14} />
                Predicted mode
              </p>
              <p className="mt-1 font-bold capitalize text-white">{formatMode(recommendation.ml_prediction.predicted_failure_mode)}</p>
            </div>
            <div className="card-muted p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Top signals</p>
              <p className="mt-1 font-semibold text-white">
                {recommendation.ml_prediction.top_signals.map(formatMode).join(", ") || "Waiting"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="panel-soft p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <ShieldAlert size={17} className="text-coolant-400" />
            Root causes
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {recommendation.probable_root_causes.map((cause) => (
              <li key={cause} className="rounded-r-md border-l-2 border-coolant-500/60 bg-coolant-500/[0.08] py-1 pl-3 pr-2">
                {cause}
              </li>
            ))}
          </ul>
        </div>
        <div className="panel-soft p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <AlertTriangle size={17} className="text-amber-400" />
            Immediate actions
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {recommendation.immediate_actions.map((action) => (
              <li key={action} className="rounded-r-md border-l-2 border-amber-500/60 bg-amber-500/[0.08] py-1 pl-3 pr-2">
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {recommendation.process_defects.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">Steel process defect signals</h3>
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-400">
              {recommendation.process_defects.length} rules
            </span>
          </div>
          <div className="mt-3 space-y-3">
            {recommendation.process_defects.map((defect) => (
              <article key={defect.id} className="card-muted p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold capitalize text-white">{formatMode(defect.defect_type)}</p>
                  <div className="flex items-center gap-2">
                    <RiskBadge risk={defect.severity} />
                    <span className="text-xs font-bold text-slate-500">{Math.round(defect.confidence * 100)}%</span>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">{defect.explanation}</p>
                <p className="mt-2 rounded-md border border-coolant-500/20 bg-coolant-500/[0.08] px-3 py-2 text-xs font-semibold leading-5 text-coolant-300">
                  {defect.recommended_action}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white">RAG retrieved evidence</h3>
          <span className="rounded-full border border-coolant-500/30 bg-coolant-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-coolant-400">
            {recommendation.evidence.length} sources
          </span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {recommendation.evidence.map((item) => (
            <article key={item.source_id} className="card-muted p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold uppercase text-slate-400">{item.source_type}</p>
                <span className="text-xs font-semibold text-coolant-400">{Math.round(item.relevance * 100)}%</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {item.source_id}
                {metadataText(item.metadata, "retrieval") ? ` - ${metadataText(item.metadata, "retrieval")}` : ""}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{item.excerpt}</p>
              {metadataText(item.metadata, "source_url") && (
                <a
                  href={metadataText(item.metadata, "source_url") ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-xs font-bold text-coolant-400 underline-offset-2 hover:underline"
                >
                  Source
                </a>
              )}
            </article>
          ))}
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="text-sm font-bold text-white">Spare strategy</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {recommendation.spare_strategy.map((strategy) => (
            <li key={strategy} className="card-muted px-3 py-2">
              {strategy}
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-white/[0.08] pt-3 text-sm font-semibold text-signal">
          {recommendation.escalation_trigger}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          title="Generate report"
          onClick={onReport}
          disabled={busy}
          className="focus-ring inline-flex items-center gap-2 rounded-md bg-white/[0.08] px-4 py-2 text-sm font-semibold text-slate-200 shadow-sm transition-all duration-300 hover:bg-white/[0.12] hover:text-white disabled:opacity-60"
        >
          <FileText size={16} />
          Report
        </button>
        <button
          type="button"
          title="Accept recommendation"
          onClick={() => void acceptRecommendation()}
          disabled={Boolean(feedbackBusy)}
          className={`focus-ring inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-300 disabled:opacity-60 ${
            feedbackState === "accepted"
              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              : "border-coolant-500/30 bg-gradient-to-r from-coolant-600 to-coolant-500 text-white hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]"
          }`}
        >
          <Check size={16} />
          {feedbackBusy === "accepted" ? "Saving..." : feedbackState === "accepted" ? "Accepted" : "Accept"}
        </button>
        <button
          type="button"
          title="Correct recommendation"
          onClick={() => openReview("corrected")}
          disabled={Boolean(feedbackBusy)}
          className={`focus-ring inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-300 disabled:opacity-60 ${
            feedbackState === "corrected"
              ? "border-amber-500/40 bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              : "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/15"
          }`}
        >
          <RotateCcw size={16} />
          {feedbackBusy === "corrected" ? "Saving..." : feedbackState === "corrected" ? "Correction noted" : "Correct"}
        </button>
        <button
          type="button"
          title="Reject recommendation"
          onClick={() => openReview("rejected")}
          disabled={Boolean(feedbackBusy)}
          className={`focus-ring inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-300 disabled:opacity-60 ${
            feedbackState === "rejected"
              ? "border-red-500/40 bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
              : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/15"
          }`}
        >
          <XCircle size={16} />
          {feedbackBusy === "rejected" ? "Saving..." : feedbackState === "rejected" ? "Rejected" : "Reject"}
        </button>
      </div>

      {reviewMode && (
        <div className="panel-soft p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <MessageSquare size={17} className="text-purple-400" />
              {reviewMode === "corrected" ? "Correction details" : "Rejection details"}
            </h3>
            {feedbackState && (
              <span className="rounded-full border border-white/[0.1] bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase text-slate-400">
                Last saved: {feedbackState}
              </span>
            )}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs font-bold uppercase text-slate-500">
              Actual root cause
              <textarea
                value={reviewForm.actualRootCause}
                onChange={(event) => updateReviewField("actualRootCause", event.target.value)}
                className="field-control min-h-20 w-full resize-y p-3 text-sm font-medium normal-case text-slate-200"
                placeholder="Bearing grease line blockage, suction leak, oil contamination..."
              />
            </label>
            <label className="space-y-1 text-xs font-bold uppercase text-slate-500">
              Action taken
              <textarea
                value={reviewForm.actionTaken}
                onChange={(event) => updateReviewField("actionTaken", event.target.value)}
                className="field-control min-h-20 w-full resize-y p-3 text-sm font-medium normal-case text-slate-200"
                placeholder="Cleaned strainer, replaced coupling insert, rescheduled outage..."
              />
            </label>
            <label className="space-y-1 text-xs font-bold uppercase text-slate-500">
              Downtime saved min
              <input
                type="number"
                min={0}
                value={reviewForm.downtimeSavedMinutes}
                onChange={(event) => updateReviewField("downtimeSavedMinutes", event.target.value)}
                className="field-control h-10 w-full px-3 text-sm font-medium normal-case text-slate-200"
                placeholder="0"
              />
            </label>
            <label className="space-y-1 text-xs font-bold uppercase text-slate-500">
              Note
              <textarea
                value={reviewForm.note}
                onChange={(event) => updateReviewField("note", event.target.value)}
                className="field-control min-h-20 w-full resize-y p-3 text-sm font-medium normal-case text-slate-200"
                placeholder={reviewMode === "corrected" ? "What should the copilot change next time?" : "Why was this recommendation rejected?"}
              />
            </label>
          </div>
          {reviewError && <p className="mt-3 text-sm font-semibold text-signal">{reviewError}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              title={reviewMode === "corrected" ? "Save correction" : "Save rejection"}
              onClick={() => void submitReview()}
              disabled={Boolean(feedbackBusy)}
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-all duration-300 hover:bg-slate-100 hover:shadow-lg disabled:opacity-60"
            >
              <Check size={16} />
              {feedbackBusy === reviewMode ? "Saving..." : reviewMode === "corrected" ? "Save correction" : "Save rejection"}
            </button>
            <button
              type="button"
              title="Cancel review"
              onClick={() => setReviewMode(null)}
              disabled={Boolean(feedbackBusy)}
              className="focus-ring inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-400 shadow-sm transition-all duration-300 hover:bg-white/[0.08] hover:text-slate-200 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
