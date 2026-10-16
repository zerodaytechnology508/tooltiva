"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import {
  applyAnalyticsConsent,
  canLoadAnalytics,
  canTrackAnalytics,
  GA_MEASUREMENT_ID,
  persistConsentChoice,
  preferenceChoice,
  readConsentChoice,
  type ConsentChoice,
  type SavedConsentChoice,
} from "@/lib/analytics-consent";
import { ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    tooltivaGtagInitialized?: boolean;
    tooltivaGaConfigured?: boolean;
    "ga-disable-G-DLDHVDXG2Q"?: boolean;
  }
}

function setAnalyticsDisabled(disabled: boolean) {
  window["ga-disable-G-DLDHVDXG2Q"] = disabled;
}

function isAnalyticsDisabled() {
  return window["ga-disable-G-DLDHVDXG2Q"] === true;
}

export function AnalyticsConsent() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const [consentLoaded, setConsentLoaded] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [analyticsDraft, setAnalyticsDraft] = useState(false);
  const [analyticsReady, setAnalyticsReady] = useState(false);
  const [preferenceError, setPreferenceError] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const scriptLoaded = useRef(false);
  const choiceRef = useRef<ConsentChoice>(null);
  const lastTrackedPath = useRef<string | null>(null);
  const analyticsToggleRef = useRef<HTMLInputElement>(null);
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const wasManaging = useRef(false);
  const wasBannerOpen = useRef(false);

  useEffect(() => {
    try {
      const savedChoice = readConsentChoice(window.localStorage);
      choiceRef.current = savedChoice;
      setChoice(savedChoice);
      setBannerOpen(savedChoice === null);
    } catch {
      setPreferenceError(true);
      setBannerOpen(true);
    } finally {
      setConsentLoaded(true);
    }
  }, []);

  const configureAnalyticsIfPermitted = useCallback((): boolean => {
    if (
      !canLoadAnalytics(choiceRef.current) ||
      isAnalyticsDisabled() ||
      typeof window.gtag !== "function" ||
      !window.tooltivaGtagInitialized
    ) {
      return false;
    }

    window.tooltivaGaConfigured = applyAnalyticsConsent(
      choiceRef.current,
      window.gtag,
      window.tooltivaGtagInitialized,
      window.tooltivaGaConfigured ?? false,
    );
    return true;
  }, []);

  useEffect(() => {
    if (!canLoadAnalytics(choice)) {
      setAnalyticsDisabled(true);
      setAnalyticsReady(false);
      lastTrackedPath.current = null;
      if (choice === "rejected") {
        window.tooltivaGaConfigured = applyAnalyticsConsent(
          choice,
          window.gtag,
          window.tooltivaGtagInitialized ?? false,
          window.tooltivaGaConfigured ?? false,
        );
      }
      return;
    }

    setAnalyticsDisabled(false);
    setAnalyticsReady(
      configureAnalyticsIfPermitted() && scriptLoaded.current,
    );
  }, [choice, configureAnalyticsIfPermitted]);

  useEffect(() => {
    if (
      !canTrackAnalytics(
        choice,
        analyticsReady,
        typeof window.gtag === "function",
      )
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

  useEffect(() => {
    if (managing && bannerOpen) {
      analyticsToggleRef.current?.focus();
      wasManaging.current = true;
      return;
    }

    if (wasManaging.current) {
      wasManaging.current = false;
      if (bannerOpen) {
        manageButtonRef.current?.focus();
      } else {
        settingsButtonRef.current?.focus();
      }
    } else if (wasBannerOpen.current && !bannerOpen) {
      settingsButtonRef.current?.focus();
    }
    wasBannerOpen.current = bannerOpen;
  }, [bannerOpen, managing]);

  function saveChoice(nextChoice: SavedConsentChoice) {
    choiceRef.current = nextChoice;
    setChoice(nextChoice);
    setLoadError(false);
    setManaging(false);
    setBannerOpen(false);

    try {
      persistConsentChoice(window.localStorage, nextChoice);
      setPreferenceError(false);
    } catch {
      setPreferenceError(true);
    }

    if (nextChoice === "rejected") {
      setAnalyticsDisabled(true);
      setAnalyticsReady(false);
    } else {
      setAnalyticsDisabled(false);
      setAnalyticsReady(
        configureAnalyticsIfPermitted() && scriptLoaded.current,
      );
    }
  }

  function openPreferences() {
    setAnalyticsDraft(canLoadAnalytics(choice));
    setManaging(true);
    setBannerOpen(true);
  }

  function cancelPreferences() {
    setManaging(false);
    if (choice !== null) {
      setBannerOpen(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
        <span aria-live="polite">
          Analytics:{" "}
          {choice === "accepted"
            ? "allowed"
            : choice === "rejected"
              ? "rejected"
              : "not set"}
        </span>
        {!bannerOpen && (preferenceError || loadError) && (
          <span role="status" className="max-w-sm text-amber-700 dark:text-amber-300">
            {preferenceError
              ? "Your choice could not be saved and applies only until this page is closed."
              : "Google Analytics failed to load."}
          </span>
        )}
        <button
          ref={settingsButtonRef}
          type="button"
          onClick={openPreferences}
          className="rounded-md underline underline-offset-2 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:hover:text-brand-300"
        >
          Privacy settings
        </button>
      </div>

      {consentLoaded && bannerOpen && (
        <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-h-[calc(100dvh-1.5rem)] max-w-5xl overflow-y-auto sm:inset-x-6">
          <section
            aria-labelledby="privacy-banner-title"
            aria-describedby="privacy-banner-description"
            className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-2xl shadow-slate-950/20 sm:p-6 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="privacy-banner-title"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  Your Privacy Matters
                </h2>
                <p
                  id="privacy-banner-description"
                  className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                >
                  Optional analytics helps us understand site traffic and
                  improve Tooltiva. Google Analytics may collect general usage
                  information as explained in our{" "}
                  <Link
                    href="/privacy/#analytics"
                    className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-300 dark:hover:text-brand-200"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            {managing ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    ref={analyticsToggleRef}
                    type="checkbox"
                    checked={analyticsDraft}
                    onChange={(event) =>
                      setAnalyticsDraft(event.currentTarget.checked)
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                      Google Analytics (optional)
                    </span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      Allow general website-usage measurement. This setting
                      does not include tool input or file contents.
                    </span>
                  </span>
                </label>
              </div>
            ) : null}

            {preferenceError && (
              <p role="status" className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                Your choice could not be saved and applies only until this page
                is closed.
              </p>
            )}
            {loadError && (
              <p role="status" className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                Google Analytics failed to load.
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {managing ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      saveChoice(preferenceChoice(analyticsDraft))
                    }
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:bg-brand-400 dark:text-slate-950 dark:hover:bg-brand-300"
                  >
                    Save Preferences
                  </button>
                  <button
                    type="button"
                    onClick={cancelPreferences}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => saveChoice("accepted")}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:bg-brand-400 dark:text-slate-950 dark:hover:bg-brand-300"
                  >
                    Accept All
                  </button>
                  <button
                    type="button"
                    onClick={() => saveChoice("rejected")}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    Reject Non-Essential
                  </button>
                  <button
                    ref={manageButtonRef}
                    type="button"
                    onClick={() => {
                      setAnalyticsDraft(canLoadAnalytics(choice));
                      setManaging(true);
                    }}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-700 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-200 dark:hover:bg-brand-900"
                  >
                    Manage Preferences
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {canLoadAnalytics(choice) && (
        <>
          <Script id="tooltiva-gtag-init" strategy="afterInteractive">
            {`
              if (!window.tooltivaGtagInitialized) {
                window.dataLayer = window.dataLayer || [];

                window.gtag = function gtag() {
                  window.dataLayer.push(arguments);
                };

                window.gtag('consent', 'default', {
                  analytics_storage: window['ga-disable-${GA_MEASUREMENT_ID}'] === true ? 'denied' : 'granted'
                });
                window.gtag('js', new Date());
                window.tooltivaGtagInitialized = true;
              }
            `}
          </Script>
          <Script
            id="tooltiva-gtag"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
            onReady={() => {
              scriptLoaded.current = true;
              if (
                canLoadAnalytics(choiceRef.current) &&
                configureAnalyticsIfPermitted()
              ) {
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
    </>
  );
}
