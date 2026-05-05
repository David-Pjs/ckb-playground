"use client";

import { useState, useEffect, useCallback } from "react";
import { useCcc } from "@ckb-ccc/connector-react";
import { CHECKPOINTS, type Checkpoint } from "@/lib/checkpoints";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckpointState {
  status: "locked" | "active" | "complete";
  rewardTxHash?: string;
  earnedAt?: number;
}

interface VerifyState {
  loading: boolean;
  result?: { ok: boolean; error?: string; rewardTxHash?: string; reward?: number };
  explanation?: string;
  loadingExplanation?: boolean;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadProgress(): Record<number, CheckpointState> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("ckb-quest-progress") ?? "{}");
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<number, CheckpointState>) {
  localStorage.setItem("ckb-quest-progress", JSON.stringify(progress));
}

function computeStates(saved: Record<number, CheckpointState>): Record<number, CheckpointState> {
  const states: Record<number, CheckpointState> = {};
  let firstIncomplete = -1;

  for (const cp of CHECKPOINTS) {
    if (saved[cp.id]?.status === "complete") {
      states[cp.id] = saved[cp.id];
    } else {
      if (firstIncomplete === -1) firstIncomplete = cp.id;
      states[cp.id] = { status: cp.id === firstIncomplete ? "active" : "locked" };
    }
  }

  return states;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QuestPage() {
  const { open, signerInfo } = useCcc();
  const signer = signerInfo?.signer;
  const [address, setAddress] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<number, CheckpointState>>({});
  const [verifyStates, setVerifyStates] = useState<Record<number, VerifyState>>({});

  useEffect(() => {
    const saved = loadProgress();
    setProgress(computeStates(saved));
  }, []);

  useEffect(() => {
    if (!signer) { setAddress(null); return; }
    signer.getRecommendedAddress().then(setAddress).catch(() => setAddress(null));
  }, [signer]);

  const completedCount = Object.values(progress).filter((s) => s.status === "complete").length;

  const handleVerify = useCallback(async (checkpoint: Checkpoint, input: string) => {
    if (!address) return;

    setVerifyStates((prev) => ({
      ...prev,
      [checkpoint.id]: { loading: true },
    }));

    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkpointId: checkpoint.id, input, address }),
    });
    const data = await res.json();

    setVerifyStates((prev) => ({
      ...prev,
      [checkpoint.id]: { loading: false, result: data, loadingExplanation: true },
    }));

    if (data.ok) {
      const saved = loadProgress();
      saved[checkpoint.id] = {
        status: "complete",
        rewardTxHash: data.rewardTxHash,
        earnedAt: Date.now(),
      };
      saveProgress(saved);
      setProgress(computeStates(saved));
    }

    // Fetch AI explanation
    const explainRes = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkpointId: checkpoint.id,
        checkpointTitle: checkpoint.title,
        concept: checkpoint.concept,
        input,
        succeeded: data.ok,
        error: data.error,
      }),
    });
    const explainData = await explainRes.json();

    setVerifyStates((prev) => ({
      ...prev,
      [checkpoint.id]: {
        ...prev[checkpoint.id],
        loadingExplanation: false,
        explanation: explainData.explanation,
      },
    }));
  }, [address]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-paper)" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px 96px" }}>

        {/* Header */}
        <header style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: "32px",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "var(--color-ink)",
                marginBottom: "6px",
              }}>
                CKB Quest
              </h1>
              <p style={{ color: "var(--color-muted)", fontSize: "14px" }}>
                5 checkpoints · real transactions · no shortcuts
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {address ? (
                <div>
                  <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--color-green)",
                    marginBottom: "4px",
                  }}>
                    connected
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(address)}
                    title={address}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--color-muted)",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      textAlign: "right",
                    }}
                  >
                    {address.slice(0, 12)}…{address.slice(-6)} ⎘
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => open()}
                  style={{
                    backgroundColor: "var(--color-ink)",
                    color: "var(--color-paper)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontFamily: "var(--font-ui)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    letterSpacing: "0.01em",
                  }}
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
            {CHECKPOINTS.map((cp, i) => {
              const state = progress[cp.id];
              const isDone = state?.status === "complete";
              const isActive = state?.status === "active";
              return (
                <div key={cp.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: isDone ? "var(--color-green)" : isActive ? "var(--color-ink)" : "var(--color-border)",
                    border: isActive ? "none" : `1.5px solid ${isDone ? "var(--color-green)" : "var(--color-border-strong)"}`,
                    transition: "background-color 0.3s",
                  }} />
                  {i < CHECKPOINTS.length - 1 && (
                    <div style={{
                      width: "32px",
                      height: "1px",
                      backgroundColor: isDone ? "var(--color-green)" : "var(--color-border)",
                      transition: "background-color 0.3s",
                    }} />
                  )}
                </div>
              );
            })}
            <span style={{ marginLeft: "8px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-muted)" }}>
              {completedCount}/5
            </span>
          </div>
        </header>

        {/* Checkpoints */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {CHECKPOINTS.map((cp) => {
            const state = progress[cp.id] ?? { status: "locked" };
            const vs = verifyStates[cp.id];
            return (
              <CheckpointCard
                key={cp.id}
                checkpoint={cp}
                state={state}
                verifyState={vs}
                address={address}
                onVerify={handleVerify}
                onConnect={() => open()}
              />
            );
          })}
        </div>

        {/* Footer */}
        {completedCount === 5 && (
          <div style={{
            marginTop: "64px",
            padding: "32px",
            backgroundColor: "var(--color-green-bg)",
            borderRadius: "8px",
            textAlign: "center",
          }}>
            <p style={{
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              fontWeight: 600,
              color: "var(--color-green)",
              marginBottom: "8px",
            }}>
              All five checkpoints complete.
            </p>
            <p style={{ color: "var(--color-muted)", fontSize: "14px" }}>
              You built on CKB. You sent real transactions. You opened a Fiber channel.<br />
              Most people in the ecosystem haven't done that.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── CheckpointCard ───────────────────────────────────────────────────────────

function CheckpointCard({
  checkpoint,
  state,
  verifyState,
  address,
  onVerify,
  onConnect,
}: {
  checkpoint: Checkpoint;
  state: CheckpointState;
  verifyState?: VerifyState;
  address: string | null;
  onVerify: (cp: Checkpoint, input: string) => void;
  onConnect: () => void;
}) {
  const [input, setInput] = useState("");
  const isLocked = state.status === "locked";
  const isComplete = state.status === "complete";
  const isActive = state.status === "active";

  const hexId = `0x0${checkpoint.id}`;

  if (isLocked) {
    return (
      <div style={{
        padding: "20px 0",
        borderTop: "1px solid var(--color-border)",
        opacity: 0.4,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-faint)" }}>{hexId}</span>
          <span style={{ color: "var(--color-muted)", fontSize: "14px", fontWeight: 500 }}>{checkpoint.title}</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-faint)" }}>
            +{checkpoint.reward} CKB
          </span>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div style={{
        padding: "20px 0",
        borderTop: "1px solid var(--color-border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-green)" }}>{hexId} ✓</span>
          <span style={{ color: "var(--color-ink)", fontSize: "14px", fontWeight: 500 }}>{checkpoint.title}</span>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-green)" }}>
              +{checkpoint.reward} CKB sent
            </span>
            {state.rewardTxHash && (
              <a
                href={`https://pudge.explorer.nervos.org/transaction/${state.rewardTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--color-faint)",
                  textDecoration: "none",
                  marginTop: "2px",
                }}
              >
                {state.rewardTxHash.slice(0, 10)}… ↗
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active
  return (
    <div style={{
      borderTop: "1px solid var(--color-border)",
      paddingTop: "32px",
      paddingBottom: "40px",
    }}>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "28px" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-muted)", marginBottom: "6px" }}>
            {hexId} · active
          </div>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--color-ink)",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}>
            {checkpoint.title}
          </h2>
          <p style={{ color: "var(--color-muted)", fontSize: "13px", marginTop: "4px" }}>
            {checkpoint.subtitle}
          </p>
        </div>
        <div style={{
          backgroundColor: "var(--color-ink)",
          color: "var(--color-paper)",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          padding: "4px 10px",
          borderRadius: "4px",
          flexShrink: 0,
          marginTop: "20px",
        }}>
          +{checkpoint.reward} CKB
        </div>
      </div>

      {/* Concept */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--color-faint)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          Concept
        </div>
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: "16px",
          lineHeight: 1.75,
          color: "var(--color-ink)",
          whiteSpace: "pre-line",
        }}>
          {checkpoint.concept}
        </p>
      </div>

      {/* Task */}
      <div style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "28px",
      }}>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--color-faint)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}>
          Your task
        </div>
        <p style={{ fontSize: "14px", color: "var(--color-ink)", lineHeight: 1.6 }}>
          {checkpoint.task}
        </p>
      </div>

      {/* Steps */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--color-faint)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}>
          Steps
        </div>
        <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "16px" }}>
          {checkpoint.steps.map((step, i) => (
            <li key={i} style={{ display: "flex", gap: "16px" }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--color-faint)",
                flexShrink: 0,
                marginTop: "2px",
                minWidth: "24px",
              }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "14px", color: "var(--color-ink)", lineHeight: 1.6, marginBottom: step.link || step.windowsNote ? "6px" : 0 }}>
                  {step.text}
                </p>
                {step.link && (
                  <a
                    href={step.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      color: "var(--color-green)",
                      textDecoration: "none",
                      display: "inline-block",
                      marginBottom: step.windowsNote ? "6px" : 0,
                    }}
                  >
                    → {step.link.label}
                  </a>
                )}
                {step.windowsNote && (
                  <div style={{
                    backgroundColor: "var(--color-amber-bg)",
                    border: "1px solid color-mix(in srgb, var(--color-amber) 25%, transparent)",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    color: "var(--color-amber)",
                    fontFamily: "var(--font-ui)",
                    lineHeight: 1.5,
                    marginTop: "4px",
                  }}>
                    <span style={{ fontFamily: "var(--font-mono)", marginRight: "6px" }}>⊞</span>
                    {step.windowsNote}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Input + verify */}
      <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "28px" }}>
        {!address ? (
          <div>
            <p style={{ fontSize: "14px", color: "var(--color-muted)", marginBottom: "12px" }}>
              Connect your wallet first to verify and claim your reward.
            </p>
            <button
              onClick={onConnect}
              style={{
                backgroundColor: "var(--color-ink)",
                color: "var(--color-paper)",
                border: "none",
                borderRadius: "6px",
                padding: "10px 20px",
                fontFamily: "var(--font-ui)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div>
            <label style={{
              display: "block",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--color-muted)",
              marginBottom: "8px",
            }}>
              {checkpoint.inputLabel}
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={checkpoint.inputPlaceholder}
                disabled={verifyState?.loading}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--color-ink)",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border-strong)",
                  borderRadius: "6px",
                  outline: "none",
                  minWidth: 0,
                }}
              />
              <button
                onClick={() => input.trim() && onVerify(checkpoint, input.trim())}
                disabled={!input.trim() || verifyState?.loading}
                style={{
                  backgroundColor: input.trim() && !verifyState?.loading ? "var(--color-ink)" : "var(--color-border)",
                  color: input.trim() && !verifyState?.loading ? "var(--color-paper)" : "var(--color-faint)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  fontFamily: "var(--font-ui)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: input.trim() && !verifyState?.loading ? "pointer" : "not-allowed",
                  flexShrink: 0,
                  transition: "background-color 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {verifyState?.loading ? "Verifying…" : "Verify →"}
              </button>
            </div>

            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-faint)", marginTop: "8px" }}>
              {checkpoint.verifyHint}
            </p>

            {/* Result */}
            {verifyState?.result && !verifyState.loading && (
              <div style={{
                marginTop: "20px",
                padding: "14px 16px",
                borderRadius: "6px",
                backgroundColor: verifyState.result.ok ? "var(--color-green-bg)" : "var(--color-red-bg)",
                border: `1px solid color-mix(in srgb, ${verifyState.result.ok ? "var(--color-green)" : "var(--color-red)"} 20%, transparent)`,
              }}>
                {verifyState.result.ok ? (
                  <div>
                    <p style={{ fontSize: "14px", color: "var(--color-green)", fontWeight: 500, marginBottom: "4px" }}>
                      ✓ Verified
                    </p>
                    {verifyState.result.rewardTxHash && (
                      <a
                        href={`https://pudge.explorer.nervos.org/transaction/${verifyState.result.rewardTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-green)", textDecoration: "none" }}
                      >
                        +{verifyState.result.reward} CKB sent → {verifyState.result.rewardTxHash.slice(0, 14)}… ↗
                      </a>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: "14px", color: "var(--color-red)", lineHeight: 1.5 }}>
                    {verifyState.result.error}
                  </p>
                )}
              </div>
            )}

            {/* AI explanation */}
            {(verifyState?.loadingExplanation || verifyState?.explanation) && (
              <div style={{
                marginTop: "16px",
                paddingLeft: "16px",
                borderLeft: "2px solid var(--color-border-strong)",
              }}>
                {verifyState?.loadingExplanation ? (
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "14px", color: "var(--color-faint)", fontStyle: "italic" }}>
                    thinking…
                  </p>
                ) : (
                  <>
                    <div style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--color-faint)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}>
                      AI note
                    </div>
                    <p style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "15px",
                      color: "var(--color-ink)",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                    }}>
                      {verifyState?.explanation}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
