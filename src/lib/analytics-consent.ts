export type ConsentChoice = "accepted" | "rejected" | null;
export type SavedConsentChoice = Exclude<ConsentChoice, null>;

export const CONSENT_STORAGE_KEY = "tooltiva-analytics-consent";
export const GA_MEASUREMENT_ID = "G-DLDHVDXG2Q";

export type GtagFunction = (...args: unknown[]) => void;

export function parseConsentChoice(value: string | null): ConsentChoice {
  return value === "accepted" || value === "rejected" ? value : null;
}

export function readConsentChoice(
  storage: Pick<Storage, "getItem">,
): ConsentChoice {
  return parseConsentChoice(storage.getItem(CONSENT_STORAGE_KEY));
}

export function persistConsentChoice(
  storage: Pick<Storage, "setItem">,
  choice: SavedConsentChoice,
): void {
  storage.setItem(CONSENT_STORAGE_KEY, choice);
}

export function preferenceChoice(
  analyticsEnabled: boolean,
): SavedConsentChoice {
  return analyticsEnabled ? "accepted" : "rejected";
}

export function canLoadAnalytics(choice: ConsentChoice): boolean {
  return choice === "accepted";
}

export function canTrackAnalytics(
  choice: ConsentChoice,
  analyticsReady: boolean,
  hasGtag: boolean,
): boolean {
  return canLoadAnalytics(choice) && analyticsReady && hasGtag;
}

export function applyAnalyticsConsent(
  choice: ConsentChoice,
  gtag: GtagFunction | undefined,
  initialized: boolean,
  configured: boolean,
): boolean {
  if (!gtag || !initialized) {
    return configured;
  }

  if (choice === "rejected") {
    gtag("consent", "update", { analytics_storage: "denied" });
    return configured;
  }

  if (!canLoadAnalytics(choice)) {
    return configured;
  }

  gtag("consent", "update", { analytics_storage: "granted" });
  if (!configured) {
    gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    return true;
  }
  return configured;
}
