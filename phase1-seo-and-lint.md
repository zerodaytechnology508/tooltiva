Continue working on the existing project at D:\Tooltiva.com.

The previous validation reported that:

* npm test passed.
* npm run build passed.
* Static export checks passed.
* ESLint is not configured.
* Keyword research evidence is missing.
* Deployment has not occurred.

Complete the following tasks without rebuilding the project.

### 1. Configure Linting

Inspect the existing Next.js 14 and TypeScript configuration.

Configure a compatible ESLint setup using appropriate dependencies and configuration.

Preserve the current architecture and application behavior.

Run linting, functional tests, and the production build. Fix genuine issues introduced by the existing code where appropriate.

Do not suppress warnings indiscriminately just to make the checks pass.

### 2. Conduct and Document SEO Research

Research the initial Tooltiva tools:

* CSV Delimiter Converter & Fixer
* CSV to JSON / JSON to CSV Converter
* JSON Formatter and Validator

Use available web research and credible keyword research sources.

Document:

* Primary and related keywords.
* Search intent.
* Search-volume data and its source, where available.
* Competitor URLs and observations.
* Search-result opportunities.
* Potential differentiation.
* Risks and limitations.
* Your recommended keyword-to-page mapping.

Record research dates and source URLs.

Never invent search volumes, keyword difficulty scores, CPC figures, or competitor weaknesses. Clearly distinguish measured figures, third-party estimates, qualitative observations, and hypotheses.

If reliable keyword metrics are unavailable, document that limitation.

Save the report in a suitable location such as docs/seo-keyword-research.md.

### 3. Review Existing SEO

Compare the existing page content, titles, meta descriptions, headings, and internal links against the documented research.

Recommend or implement targeted improvements where the evidence supports them. Keep all content original, useful, and aligned with actual tool functionality.

Do not add repetitive content or create unnecessary pages merely to target additional keywords.

### 4. Preserve and Validate the Project

Keep the existing Next.js App Router, TypeScript, Tailwind CSS, and static-export architecture.

Do not delete or unnecessarily rewrite working code.

Retain the existing backup. If Git remains unavailable, clearly document the limitation.

After changes, run:

* npm run lint
* npm test
* npm run build

Report actual command results. Recheck the static export and important SEO configuration.

### 5. Stop Before Deployment

Do not deploy yet.

Provide a report of the changes, test results, keyword research findings, unresolved issues, and remaining launch requirements.

Wait for my review before proceeding to public deployment.
