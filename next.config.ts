import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["essay-carport-zesty.ngrok-free.dev"],

  // The `payment` feature (and WebAuthn/passkey features Visa's
  // Click-to-Pay flow also uses) default to `self` in browsers'
  // Permissions-Policy — meaning a cross-origin iframe is denied them
  // even if that iframe itself has allow="payment", unless THIS
  // top-level document explicitly grants the origin via a
  // Permissions-Policy response header. Prava's SDK already sets
  // allow="payment" correctly on the iframe it mounts (confirmed by
  // reading @prava-sdk/core's bundled source) — without this header,
  // the browser denies the permission before it ever reaches Prava's
  // code, which is exactly the
  // "[Violation] Permissions policy violation: payment is not allowed
  // in this document" seen in the console when their nested Visa VTS
  // auth iframe tries to use it.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: [
              "payment=(self \"https://sandbox.collect.prava.space\")",
              "publickey-credentials-get=(self \"https://sandbox.collect.prava.space\")",
              "publickey-credentials-create=(self \"https://sandbox.collect.prava.space\")",
            ].join(", "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;