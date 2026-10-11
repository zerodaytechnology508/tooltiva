"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const MEASUREMENT_ID = "G-PXHEBC69CY";
const CONSENT_STORAGE_KEY = "tooltiva-analytics-consent";
type ConsentChoice = "accepted" | "rejected" | null;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    tooltivaGtagInitialized?: boolean;
    "ga-disable-G-PXHEBC69CY"?: boolean;
  }
}

export function AnalyticsConsent() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const [analyticsReady, setAnalyticsReady] = useState(false);
  const [preferenceError, setPreferenceError] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const scriptLoaded = useRef(false);
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    try {
      const storedChoice = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      if (storedChoice === "accepted" || storedChoice === "rejected") {
        setChoice(storedChoice);
      }
    } catch {
      setPreferenceError(true);
    }
  }, []);

  useEffect(() => {
    if (choice !== "accepted") {
      setAnalyticsReady(false);
      lastTrackedPath.current = null;
      return;
    }

    window["ga-disable-G-PXHEBC69CY"] = false;
    if (typeof window.gtag === "function" && window.tooltivaGtagInitialized) {
      window.gtag("consent", "update", { analytics_storage: "granted" });
      setAnalyticsReady(scriptLoaded.current);
    }
  }, [choice]);

  useEffect(() => {
    if (
      choice !== "accepted" ||
      !analyticsReady ||
      typeof window.gtag !== "function"
    ) {
      return;
    }

    const safePath = pathname || "/";
    if (lastTrackedPath.current === safePath) {
      return;
    }

    const pageLocation = `${window.location.origin}${safePath}`;
    const pageReferrer = lastTrackedPath.current
      ? `${window.location.origin}${lastTrackedPath.current}`
      : "";

    const pageParameters = {
      page_path: safePath,
      page_location: pageLocation,
      page_referrer: pageReferrer,
      page_title: "Tooltiva",
    };

    window.gtag("set", pageParameters);
    window.gtag("event", "page_view", pageParameters);
    lastTrackedPath.current = safePath;
  }, [analyticsReady, choice, pathname]);

  function saveChoice(nextChoice: Exclude<ConsentChoice, null>) {
    setChoice(nextChoice);
    setLoadError(false);

    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, nextChoice);
      setPreferenceError(false);
    } catch {
      setPreferenceError(true);
    }

    if (nextChoice === "rejected") {
      window["ga-disable-G-PXHEBC69CY"] = true;
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", { analytics_storage: "denied" });
      }
      setAnalyticsReady(false);
    } else {
      window["ga-disable-G-PXHEBC69CY"] = false;
      if (typeof window.gtag === "function" && window.tooltivaGtagInitialized) {
        window.gtag("consent", "update", { analytics_storage: "granted" });
        setAnalyticsReady(scriptLoaded.current);
      }
    }
  }

  return (
    <div className="flex flex-col items-center sm:items-start gap-1.5 text-center sm:text-left">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
        <span aria-live="polite">
          Analytics:{" "}
          {choice === "accepted"
            ? "allowed"
            : choice === "rejected"
              ? "rejected"
              : "off unless allowed"}
        </span>
        <Link
          href="/privacy/#analytics"
          className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Privacy details
        </Link>
      </div>
      <div className="flex flex-wrap justify-center sm:justify-start gap-2">
        <button
          type="button"
          onClick={() => saveChoice("accepted")}
          className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Allow analytics
        </button>
        <button
          type="button"
          onClick={() => saveChoice("rejected")}
          className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Reject analytics
        </button>
      </div>
      {preferenceError && (
        <p role="status" className="max-w-sm text-amber-700 dark:text-amber-300">
          Your choice could not be saved in this browser. It applies only until
          this page is closed.
        </p>
      )}
      {loadError && (
        <p role="status" className="max-w-sm text-amber-700 dark:text-amber-300">
          Google Analytics failed to load.
        </p>
      )}

      {choice === "accepted" && (
        <>
          <Script id="tooltiva-gtag-init" strategy="afterInteractive">
            {`
              if (!window.tooltivaGtagInitialized) {
                window.dataLayer = window.dataLayer || [];

                window.gtag = function gtag() {
                  window.dataLayer.push(arguments);
                };

                var tooltivaPath = window.location.pathname || '/';
                var tooltivaPage = {
                  page_path: tooltivaPath,
                  page_location: window.location.origin + tooltivaPath,
                  page_referrer: '',
                  page_title: 'Tooltiva'
                };

                window.gtag('consent', 'default', {
                  analytics_storage: 'granted'
                });
                window.gtag('js', new Date());
                window.gtag('set', tooltivaPage);
                window.gtag('config', '${MEASUREMENT_ID}', {
                  send_page_view: false,
                  allow_google_signals: false,
                  allow_ad_personalization_signals: false,
                  ...tooltivaPage
                });

                window.tooltivaGtagInitialized = true;
              }
            `}
          </Script>
          <Script
            id="tooltiva-gtag"
            src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
            strategy="afterInteractive"
            onReady={() => {
              scriptLoaded.current = true;
              if (choice === "accepted" && window.tooltivaGtagInitialized) {
                setAnalyticsReady(true);
              }
            }}
            onError={() => {
              setAnalyticsReady(false);
              setLoadError(true);
              console.error("Google Analytics failed to load.");
            }}
          />
        </>
      )}
    </div>
  );
}
