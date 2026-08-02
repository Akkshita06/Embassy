"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";

import type { LinkedCard, Mandate } from "@/lib/mock-data";
import { mountCollectPAN } from "@/lib/prava/collect-pan";
import { formatINR } from "@/lib/utils";

type Stage =
  | "form"
  | "creating-session"
  | "collecting"
  | "success"
  | "error";

const STAGE_STEP: Record<Stage, 1 | 2> = {
  form: 1,
  "creating-session": 2,
  collecting: 2,
  success: 2,
  error: 2,
};

interface PravaSessionData {
  sessionToken: string;
  iframeUrl: string;
}

export function CardLinkPanel({
  open,
  onClose,
  onLinked,
}: {
  open: boolean;
  onClose: () => void;
  onLinked: (mandate: Mandate) => void;
}) {
  const [stage, setStage] = useState<Stage>("form");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null
  );
  const [iframeReady, setIframeReady] = useState(false);
  const [confirmAbandon, setConfirmAbandon] =
    useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [dailyLimit, setDailyLimit] =
    useState(10000);
  const [perChargeLimit, setPerChargeLimit] =
    useState(5000);
  const [merchantsInput, setMerchantsInput] =
    useState("");

  const [pravaSession, setPravaSession] =
    useState<PravaSessionData | null>(null);

  const collectContainerRef =
    useRef<HTMLDivElement>(null);

  const collectCleanupRef =
    useRef<(() => void) | null>(null);

  const readyTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  function clearReadyTimeout() {
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
  }

  function cleanupCollect() {
    collectCleanupRef.current?.();
    collectCleanupRef.current = null;
  }

  function reset() {
    cleanupCollect();
    clearReadyTimeout();

    setStage("form");
    setErrorMessage(null);
    setIframeReady(false);
    setConfirmAbandon(false);

    setName("");
    setCategory("");
    setDailyLimit(10000);
    setPerChargeLimit(5000);
    setMerchantsInput("");

    setPravaSession(null);
  }

  function doClose() {
    cleanupCollect();
    clearReadyTimeout();

    onClose();

    window.setTimeout(() => {
      reset();
    }, 200);
  }

  function handleClose() {
    if (
      stage === "collecting" &&
      !confirmAbandon
    ) {
      setConfirmAbandon(true);
      return;
    }

    doClose();
  }

  async function handleStartLinking() {
    setErrorMessage(null);
    setConfirmAbandon(false);
    setIframeReady(false);

    cleanupCollect();
    clearReadyTimeout();

    setPravaSession(null);
    setStage("creating-session");

    try {
      const response = await fetch(
        "/api/prava/session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: "workspace-owner",
            userEmail: "owner@embassy.app",
            totalAmount: perChargeLimit,
            currency: "inr",
            purchaseContext: {
              reference_id:
                `mandate-link-${Date.now()}`,
              description:
                name ||
                "New mandate card link",
              amount: perChargeLimit,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data?.detail) {
          console.error(
            "[Embassy] Prava session detail:",
            data.detail
          );
        }

        throw new Error(
          data?.error ??
            "Failed to create Prava session."
        );
      }

      if (
        !data?.sessionToken ||
        !data?.iframeUrl
      ) {
        throw new Error(
          "Prava returned incomplete session data."
        );
      }

      setPravaSession({
        sessionToken: data.sessionToken,
        iframeUrl: data.iframeUrl,
      });

      setStage("collecting");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );

      setStage("error");
    }
  }

  useEffect(() => {
    if (
      stage !== "collecting" ||
      !pravaSession
    ) {
      return;
    }

    const container =
      collectContainerRef.current;

    if (!container) {
      setErrorMessage(
        "Card collection container failed to mount."
      );

      setStage("error");

      return;
    }

    /*
     * The Visa UI is visibly mounting in your screenshot, but this
     * SDK flow does not consistently emit the optional onReady
     * callback. Therefore, onReady is used when available, while
     * a short fallback removes Embassy's overlay instead of keeping
     * the working Visa UI blocked forever.
     */
    collectCleanupRef.current =
      mountCollectPAN({
        sessionToken:
          pravaSession.sessionToken,

        iframeUrl:
          pravaSession.iframeUrl,

        container,

        onReady: () => {
          console.log(
            "[Embassy] Prava onReady received."
          );

          clearReadyTimeout();
          setIframeReady(true);
        },

        onSuccess: (result) => {
          clearReadyTimeout();

          const card: LinkedCard = {
            enrollmentId:
              result.enrollmentId,
            last4:
              result.last4,
            brand:
              result.brand,
          };

          const mandate: Mandate = {
            id: result.enrollmentId,
            name:
              name ||
              "Untitled mandate",
            category:
              category ||
              "Uncategorized",
            dailyLimit,
            perChargeLimit,

            merchants: merchantsInput
              .split(",")
              .map((merchant) =>
                merchant.trim()
              )
              .filter(Boolean)
              .map((merchantName) => ({
                name: merchantName,
              })),

            status: "active",
            spentToday: 0,
            card,
          };

          setIframeReady(true);
          setStage("success");

          onLinked(mandate);
        },

        onError: (message) => {
          clearReadyTimeout();

          setErrorMessage(message);
          setStage("error");
        },
      });

    /*
     * IMPORTANT:
     * Do not show an error merely because onReady was not emitted.
     *
     * Your Visa console already shows:
     * "Auth Session Created"
     * "Session ready - Promise resolved"
     *
     * and the Visa UI is visible behind Embassy's overlay.
     * This fallback therefore reveals the mounted Visa UI.
     */
    readyTimeoutRef.current =
      window.setTimeout(() => {
        console.warn(
          "[Embassy] Prava did not emit onReady. " +
            "Removing Embassy loading overlay."
        );

        setIframeReady(true);
        readyTimeoutRef.current = null;
      }, 2500);

    return () => {
      clearReadyTimeout();

      collectCleanupRef.current?.();
      collectCleanupRef.current = null;
    };

    // The session object identifies each new card-link session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, pravaSession]);

  useEffect(() => {
    return () => {
      cleanupCollect();
      clearReadyTimeout();
    };
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 34,
            }}
            className="fixed right-0 top-0 z-50 h-screen w-full max-w-md overflow-y-auto border-l border-border bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-soft">
                  New mandate · Step{" "}
                  {STAGE_STEP[stage]} of 2
                </p>

                <h2 className="mt-1 font-display text-xl text-ink">
                  {STAGE_STEP[stage] === 1
                    ? "Mandate details"
                    : "Link a card"}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {stage === "form" && (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-soft">
                    Mandate name
                  </label>

                  <input
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Marketing Tools"
                    className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-accent-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-soft">
                    Category
                  </label>

                  <input
                    value={category}
                    onChange={(event) =>
                      setCategory(
                        event.target.value
                      )
                    }
                    placeholder="e.g. SaaS & Tools"
                    className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-accent-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-soft">
                      Daily limit
                    </label>

                    <div className="relative mt-2">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-soft">
                        ₹
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={dailyLimit}
                        onChange={(event) =>
                          setDailyLimit(
                            Number(
                              event.target.value
                            ) || 0
                          )
                        }
                        className="w-full rounded-lg border border-border bg-bg py-2 pl-7 pr-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-ring"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-soft">
                      Per-charge limit
                    </label>

                    <div className="relative mt-2">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-soft">
                        ₹
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={
                          perChargeLimit
                        }
                        onChange={(event) =>
                          setPerChargeLimit(
                            Number(
                              event.target.value
                            ) || 0
                          )
                        }
                        className="w-full rounded-lg border border-border bg-bg py-2 pl-7 pr-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-ring"
                      />
                    </div>
                  </div>
                </div>

                {perChargeLimit >
                  dailyLimit && (
                  <p className="text-xs text-error">
                    Per-charge limit cannot
                    exceed the daily limit.
                  </p>
                )}

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-soft">
                    Allowed merchants
                  </label>

                  <input
                    value={
                      merchantsInput
                    }
                    onChange={(event) =>
                      setMerchantsInput(
                        event.target.value
                      )
                    }
                    placeholder="Stripe, Vercel, OpenAI"
                    className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-accent-ring"
                  />

                  {!merchantsInput.trim() && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-soft">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Leaving this blank
                      allows charges at any
                      merchant.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={
                    handleStartLinking
                  }
                  disabled={
                    !name.trim() ||
                    dailyLimit <= 0 ||
                    perChargeLimit <= 0 ||
                    perChargeLimit >
                      dailyLimit
                  }
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  Continue to card linking
                </button>
              </div>
            )}

            {stage ===
              "creating-session" && (
              <div className="mt-8 flex flex-col items-center gap-3 py-10 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted" />

                <p className="text-sm text-muted">
                  Starting a secure
                  session…
                </p>
              </div>
            )}

            {stage === "collecting" && (
              <div className="mt-5">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-soft">
                  Enter card details
                </p>

                {confirmAbandon && (
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error">
                    <span>
                      Card entry isn&apos;t
                      finished — discard it?
                    </span>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAbandon(
                            false
                          )
                        }
                        className="rounded-md px-2 py-1 font-medium text-ink hover:bg-surface-2"
                      >
                        Keep going
                      </button>

                      <button
                        type="button"
                        onClick={doClose}
                        className="rounded-md bg-error px-2 py-1 font-medium text-surface hover:opacity-90"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative min-h-[420px] overflow-hidden rounded-xl border border-border-soft bg-surface-2 p-3">
                  {!iframeReady && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-surface-2/90">
                      <Loader2 className="h-5 w-5 animate-spin text-muted" />

                      <p className="text-xs text-muted">
                        Loading secure card
                        form…
                      </p>
                    </div>
                  )}

                  <div
                    ref={
                      collectContainerRef
                    }
                    id="prava-card-container"
                    className="relative z-10 min-h-[390px] w-full"
                  />
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-soft">
                  <ShieldCheck className="h-3.5 w-3.5" />

                  Card details go straight
                  to Prava — Embassy never
                  sees the full number.
                </p>
              </div>
            )}

            {stage === "success" && (
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-2 rounded-lg border border-success/25 bg-success/10 p-3 text-sm text-success">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                  <span>
                    Card linked. The mandate
                    is ready with a{" "}
                    <span className="font-medium">
                      {formatINR(
                        dailyLimit
                      )}
                    </span>{" "}
                    daily limit.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={doClose}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90"
                >
                  Done
                </button>
              </div>
            )}

            {stage === "error" && (
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                  <span>
                    {errorMessage}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={
                    handleStartLinking
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-2"
                >
                  Try again
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}