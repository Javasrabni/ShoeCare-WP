"use client";

import { Turnstile } from "@marsidev/react-turnstile";
// import { useState } from "react";
import { useRef } from "react";

export default function TurnstileWidget({
  onVerify,
}: {
  onVerify: (token: string) => void;
}) {
  // const [token, setToken] = useState<string | null>(null);
const ref = useRef<any>(null);
  return (
    <Turnstile
      ref={ref}
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
      onSuccess={(token) => {
        // setToken(token);
        onVerify(token);
      }}
      options={{
        theme: "light",
      }}
    />
  );
}
