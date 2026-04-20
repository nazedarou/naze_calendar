import { toggleProposalSent } from "./actions";

export function ProposalToggleButton({
  clientId,
  sent,
  compact = false,
}: {
  clientId: string;
  sent: boolean;
  compact?: boolean;
}) {
  return (
    <form action={toggleProposalSent.bind(null, clientId)}>
      <button
        type="submit"
        className={
          compact
            ? sent
              ? "text-[10px] uppercase tabular-nums px-2 py-1 border border-green-400 text-green-700 bg-green-50 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
              : "text-[10px] uppercase tabular-nums px-2 py-1 border border-stone-300 text-stone-500 hover:border-ink-900 hover:text-ink-900 transition-colors"
            : sent
              ? "w-full flex items-center justify-between px-4 py-3 border border-green-400 bg-green-50 text-green-800 text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
              : "w-full flex items-center justify-between px-4 py-3 border border-stone-300 bg-white text-stone-600 text-sm font-medium hover:border-ink-900 hover:text-ink-900 transition-colors"
        }
        style={{ fontFamily: compact ? "var(--font-mono)" : undefined }}
        title={sent ? "Click to undo — mark proposal as not sent" : "Mark proposal as sent"}
      >
        {compact ? (
          sent ? "✓ Sent" : "Send"
        ) : (
          <>
            <span>{sent ? "✓ Proposal sent" : "Send proposal"}</span>
            <span className="text-xs opacity-60">{sent ? "undo" : ""}</span>
          </>
        )}
      </button>
    </form>
  );
}
