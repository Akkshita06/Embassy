"use client";

import { PravaSDK } from "@prava-sdk/core";

export interface PravaCollectResult {
  enrollmentId: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
}

export interface MountCollectPANParams {
  sessionToken: string;
  iframeUrl: string;
  container: HTMLElement;
  onReady?: () => void;
  onSuccess: (result: PravaCollectResult) => void;
  onError: (message: string) => void;
}

type PravaSdkError = {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
};

/**
 * Mount Prava's secure card collection UI.
 *
 * The Visa/Prava SDK may resolve collectPAN() without calling the
 * optional onReady callback. Therefore, a resolved collectPAN promise
 * is treated as the primary readiness signal.
 */
export function mountCollectPAN(
  params: MountCollectPANParams
): () => void {
  const {
    sessionToken,
    iframeUrl,
    container,
    onReady,
    onSuccess,
    onError,
  } = params;

  const publishableKey =
    process.env.NEXT_PUBLIC_PRAVA_PUBLISHABLE_KEY;

  let sdk: PravaSDK | null = null;
  let destroyed = false;
  let readyReported = false;

  /**
   * Ensures the parent component receives onReady only once.
   */
  const reportReady = (source: string) => {
    if (destroyed || readyReported) {
      return;
    }

    readyReported = true;

    console.log("[Embassy] Prava card form marked ready.", {
      source,
      iframeCount:
        container.querySelectorAll("iframe").length,
      childCount:
        container.children.length,
    });

    onReady?.();
  };

  /**
   * Validate configuration before initializing the SDK.
   */
  if (!publishableKey?.trim()) {
    const message =
      "NEXT_PUBLIC_PRAVA_PUBLISHABLE_KEY is not configured.";

    console.error(
      "[Embassy] Prava configuration error:",
      message
    );

    onError(message);

    return () => {};
  }

  if (!publishableKey.trim().startsWith("pk_")) {
    const message =
      "Prava publishable key must start with pk_.";

    console.error(
      "[Embassy] Prava configuration error:",
      message
    );

    onError(message);

    return () => {};
  }

  if (!sessionToken?.trim()) {
    const message =
      "Prava session token is missing.";

    console.error(
      "[Embassy] Prava configuration error:",
      message
    );

    onError(message);

    return () => {};
  }

  if (!iframeUrl?.trim()) {
    const message =
      "Prava iframe URL is missing.";

    console.error(
      "[Embassy] Prava configuration error:",
      message
    );

    onError(message);

    return () => {};
  }

  /**
   * Validate the secure iframe URL.
   */
  try {
    const parsedUrl = new URL(iframeUrl);

    if (parsedUrl.protocol !== "https:") {
      throw new Error(
        "Prava iframe URL must use HTTPS."
      );
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Prava iframe URL is invalid.";

    console.error(
      "[Embassy] Invalid Prava iframe URL:",
      message
    );

    onError(message);

    return () => {};
  }

  try {
    /*
     * Remove an old SDK mount before creating a new session.
     */
    container.innerHTML = "";

    sdk = new PravaSDK({
      publishableKey:
        publishableKey.trim(),
    });

    console.log(
      "[Embassy] Starting Prava collectPAN...",
      {
        pageOrigin:
          typeof window !== "undefined"
            ? window.location.origin
            : "unknown",

        containerConnected:
          container.isConnected,

        containerWidth:
          container.clientWidth,

        containerHeight:
          container.clientHeight,
      }
    );

    void sdk
      .collectPAN({
        sessionToken:
          sessionToken.trim(),

        iframeUrl:
          iframeUrl.trim(),

        container,

        /*
         * Use the SDK callback when it is emitted.
         */
        onReady: () => {
          reportReady(
            "Prava SDK onReady callback"
          );
        },

        onSuccess: (result) => {
          if (destroyed) {
            return;
          }

          console.log(
            "[Embassy] Prava enrollment succeeded:",
            {
              enrollmentId:
                result.enrollmentId,

              last4:
                result.last4,

              brand:
                result.brand,
            }
          );

          onSuccess({
            enrollmentId:
              result.enrollmentId,

            last4:
              result.last4,

            brand:
              result.brand,

            expMonth:
              result.expMonth,

            expYear:
              result.expYear,
          });
        },

        onError: (error) => {
          if (destroyed) {
            return;
          }

          const pravaError =
            error as PravaSdkError;

          console.error(
            "[Embassy] Prava callback error:",
            {
              code:
                pravaError?.code,

              message:
                pravaError?.message,

              details:
                pravaError?.details,
            }
          );

          onError(
            pravaError?.message ??
              "Prava could not load the secure card form."
          );
        },
      })
      .then(() => {
        if (destroyed) {
          return;
        }

        /*
         * Your Visa console shows:
         *
         * "Session ready - Promise resolved"
         *
         * This SDK version may resolve the promise without firing
         * the optional onReady callback. Therefore, mark the form
         * ready when collectPAN resolves.
         */
        console.log(
          "[Embassy] Prava collectPAN promise resolved. " +
            "Marking the card form ready."
        );

        reportReady(
          "collectPAN promise resolved"
        );
      })
      .catch((error: unknown) => {
        if (destroyed) {
          return;
        }

        const pravaError =
          error as PravaSdkError;

        console.error(
          "[Embassy] Prava SDK error:",
          {
            code:
              pravaError?.code,

            message:
              pravaError?.message,

            details:
              pravaError?.details,
          }
        );

        onError(
          pravaError?.message ??
            "Prava could not start card collection."
        );
      });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to initialize Prava.";

    console.error(
      "[Embassy] Prava initialization error:",
      error
    );

    onError(message);
  }

  /**
   * Cleanup when the component unmounts or a new card-link
   * session replaces the current one.
   */
  return () => {
    destroyed = true;

    console.log(
      "[Embassy] Destroying Prava card collection."
    );

    try {
      sdk?.destroy();
    } catch (error) {
      console.warn(
        "[Embassy] Error while destroying Prava SDK:",
        error
      );
    }

    container.innerHTML = "";
  };
}