# 7. Task #07 — Security review (Lecture #12)

The scope is the two Smart Campus solutions only. No third-party service was
scanned, probed or load-tested; every runtime check below was performed against
the student's own applications, by hand, in a browser.

## 7.1 The four Lecture #12 vulnerability classes

| Class | Code-based solution | Low-code solution |
|---|---|---|
| **SQL injection** | **Not reachable.** There is no database, no query and no server. The fixtures are a frozen array in a module. | **Not reachable.** No datasource was connected; the JS Object holds the data. The risk would appear the moment a datasource is added and a binding is concatenated into a query string. |
| **Cross-site scripting (XSS)** | **Mitigated by construction.** React escapes every interpolated string, and the only user text that reaches the screen is echoed inside the AC6 message. There is no `dangerouslySetInnerHTML` anywhere in the repository. Verified: entering `<img src=x onerror=alert(1)>` as the start time produces `MALFORMED_INPUT`, and the payload comes back **escaped** — the rendered markup contains `&lt;img src=x onerror=alert(1)&gt;` and no `<img` element. Transcript in `evidence/xss-probe.txt`. | **Not mitigated. The one place where the two solutions genuinely differ — see §7.2.1.** The same payload is rejected correctly by the rules, but the echo of it inside the AC6 message is **rendered as markup** by the Text widget rather than escaped. |
| **Broken authentication** | **Out of scope by design.** There is no login, no session and no user record — the practice scenario forbids them. Nothing can be authenticated incorrectly because nothing is authenticated. | **The real surface is the builder account, not the app.** A published app has no login, which is intended. The account that can edit and deploy it does, and it is protected by whatever that single account uses. |
| **Sensitive-data exposure** | **No sensitive data exists.** `Room 301` and `Faculty meeting` are fictional; `AGENTS.md` in the lineage of this project forbids real names and real addresses, and that rule was kept. No `.env` file exists and no `import.meta.env` or `process.env` is read anywhere. | **Same data, but it now sits on a vendor's infrastructure.** The fictional booking is stored in Appsmith's application definition. Had the data been real, publishing the app publicly would have published the data with it. |

## 7.2.1 Finding X-01 — the low-code Text widget renders markup

**What was done.** `<img src=x onerror=alert(1)>` was typed into the start-time
field of each published application and the result was read off the screen.

**Code-based.** Verdict `MALFORMED_INPUT` / AC6. The payload is echoed inside
the message as text; the emitted markup contains
`&lt;img src=x onerror=alert(1)&gt;` and no element. Nothing loads, nothing runs.

**Low-code.** The same verdict — the *rules* behaved identically, which is the
point of §5. But the message did not come back as text. The Text widget parsed
it, created an `<img>` element, the browser tried to fetch `x`, failed, and
drew a broken-image placeholder in the middle of the sentence (Figure 7.1).

![Figure 7.1 — the low-code app with the XSS probe in the start-time field. The verdict and the reason code are correct; the payload inside the message has been rendered as an image element instead of printed as text.](report/img/lc-xss.png)

**What this does and does not establish.** It establishes that user input
reaching a Text widget is treated as markup, not as text — an output-encoding
surface that the code-based solution does not have. It does **not** establish
that the payload is executable: no alert appeared, which suggests the platform
strips inline event handlers. That is an inference about the vendor's
sanitiser, not a result of this test, and it is exactly the kind of thing I
cannot verify from inside the product. No further payloads were tried: the
finding is already actionable, and probing a sanitiser for a working bypass is
not what this review is for.

**Severity and fix.** In this application the data is fictional, the app is
intentionally public and there is no session to steal, so the practical impact
here is nil. The engineering lesson is not nil: **do not echo raw user input
into a Text widget.** The fix is to report the field name without the value, or
to pass the value through a sanitising expression before binding it. The
code-based solution needed no such rule, because its renderer escapes by
default.

This is the clearest single illustration of the trade in §8: the same AC6
message is safe by default in one solution and unsafe by default in the other,
and only one of the two would have shown that in a code review.

## 7.2 Input validation and output handling

The contract in §2 is itself the input-validation specification: two text
fields, a strict `HH:MM` pattern, an integer pattern, a numeric range, and a
single sentence out. Both implementations reject before interpreting. The two
regular expressions are anchored (`^…$`) and bounded, so neither can backtrack
catastrophically on a long input.

The output path carries exactly one piece of user-supplied text — the raw input
echoed back inside a `MALFORMED_INPUT` message — and it is escaped by the
renderer in both solutions.

Both probes are recorded in §7.2.1: the code-based transcript in
`evidence/xss-probe.txt`, the low-code result in Figure 7.1.

## 7.3 Permissions, sharing and secrets

| Check | Code-based | Low-code |
|---|---|---|
| Who can read the running app | anyone — a public GitHub Pages site, as intended | anyone with the link once published, as intended |
| Who can change it | GitHub account owner, via a commit that is recorded | Appsmith workspace member, via **Deploy**. On the free plan, access is granted **per workspace, not per application** (Figure 7.1) — the Share dialog states that invited users get access to every application in the workspace, and application-level access requires the business plan |
| Secrets in the client | none. No API key, token or credential exists in the repository | none. No datasource and no connector was configured, so there is no credential to leak |
| Secrets in screenshots | the report was checked before submission; no token, email or account identifier appears in any figure | same check applied |
| Third-party connectors | none | none — confirmed in the export: `datasourceList: []` and `customJSLibList: []`. Least privilege by simply not connecting anything |

![Figure 7.1 — the Appsmith Share dialog. Public access is a single switch, but invited users get the whole workspace: per-application access is a paid feature.](report/img/lc-share.png)

Least privilege was applied to the AI tool as well: Claude was given the
repository contents and the practice brief, and was not given access to the
GitHub account, the Appsmith account or any credential. Every change it
proposed was applied by a person.

## 7.4 SCA — dependency and platform update responsibility

### What the scan actually found

`npm audit` was run on the final lockfile. It did not come back clean:

```
6 vulnerabilities (3 moderate, 1 high, 2 critical)
```

| Package | Severity | Advisory, in short | Direct? |
|---|---|---|---|
| `tinypool` | **critical** | prototype pollution in worker options leading to remote code execution | no — via `vitest` |
| `vitest` | **critical** | arbitrary file read and execution while the Vitest UI server is listening | yes |
| `vite` | **high** | path traversal in optimized-deps handling; `server.fs.deny` bypass; cross-origin script execution through dev middleware | yes |
| `esbuild` | moderate | any website can send requests to the dev server and read the response | no — via `vite` |
| `@vitest/mocker` | moderate | path traversal / arbitrary file read via redirect mock | no — via `vitest` |
| `vite-node` | moderate | inherits the `vite` advisories | no — via `vitest` |

Full output: `evidence/npm-audit.txt` in the repository.

### Reachability — the part the severity number does not tell you

Every one of the six is a **development dependency**. The production
dependency list of this project is two entries long:

```json
"dependencies": { "react": "^18.3.1", "react-dom": "^18.3.1" }
```

The published site is one CSS file and one JavaScript bundle. Searching that
bundle for each vulnerable package returns nothing:

```
tinypool        in docs/assets/*.js : 0 matches
esbuild         in docs/assets/*.js : 0 matches
vitest          in docs/assets/*.js : 0 matches
vite-node       in docs/assets/*.js : 0 matches
@vitest/mocker  in docs/assets/*.js : 0 matches
```

The advisories describe the **dev server** and the **test runner** — surfaces
that exist while `npm run dev` or `npx vitest` is running on a developer's
machine, and that do not exist for a visitor to the GitHub Pages site. The
exposure is to me, on my laptop, while developing; it is not to a user of the
deployed application.

### The decision, and why it was not `npm audit fix --force`

`npm audit` reports a fix for all six, and states what the fix costs:

```
Will install vitest@5.1.1, which is a breaking change
Will install vite@8.3.8, which is a breaking change
```

Two major-version bumps of the test runner and the build tool. The test suite
is the evidence for every correctness claim in this report, and the screenshots
in §5 were taken against Vitest 2.1.9. Upgrading both majors at submission time
would risk invalidating that evidence to close advisories that the deployed
artefact cannot reach.

So the decision recorded here is: **do not upgrade now; upgrade both majors as
the first task after submission, and do not run `npm run dev` or the Vitest UI
on an untrusted network until then.** That is a real mitigation with a real
condition attached, not a clean bill of health.

### The comparison this makes possible

| | Code-based | Low-code |
|---|---|---|
| What I depend on | 99 npm packages, pinned in `package-lock.json`; direct dependencies are React, Vite, TypeScript and Vitest | the Appsmith platform, version chosen by the vendor |
| Who patches a vulnerability | **me** — I must notice the advisory and bump the version | **the vendor** — usually before I know there was one |
| How I find out | `npm audit`, and the lockfile makes the exact versions auditable | a changelog, if I read it |
| What I cannot do | nothing — I control every version | I cannot pin, delay or audit the platform version; an upgrade can change my app's behaviour without a commit on my side |

This is the clearest trade in the whole comparison, and the audit above is
what makes it concrete rather than theoretical. The code-based solution handed
me six advisories, a reachability question to answer and an upgrade decision to
own — work the low-code solution never asked of me. In exchange I could *see*
all of it. On the Appsmith side the equivalent question is unanswerable from
inside the product: I cannot enumerate the platform's dependencies, cannot know
whether an advisory affects my app, and cannot choose when the fix lands.

## 7.5 DAST — manual runtime checks performed

All checks were run against my own two applications, in a normal browser, with
no scanner and no automated tooling pointed at any vendor.

| # | Check | Code-based result | Low-code result |
|---|---|---|---|
| D1 | Script payload in the start-time field | `MALFORMED_INPUT`; returned escaped, no execution (`evidence/xss-probe.txt`) | `MALFORMED_INPUT`, but the payload is rendered as an element rather than printed — finding X-01 (Figure 7.1) |
| D2 | Very long input (500+ characters) in both fields | rejected by the anchored pattern; both regular expressions are bounded, so neither can backtrack | not performed |
| D3 | Negative duration (`-30`) | `DURATION_OUT_OF_RANGE`, no crash | not performed — the same expression is shared, and T4 (`0`) exercises the same branch |
| D4 | Repeated checks across the whole test run | booking table unchanged; frozen snapshot throws on write (T8/T8b) | booking table unchanged after T1–T7 (T8, visible in every figure) |
| D5 | Published app opened in a private window | loads over GitHub Pages, no login | loads, no sign-in prompt; independently confirmed by fetching the URL without credentials |
| D6 | Stored definition inspected for credentials | none present; only `react` and `react-dom` ship | none present in the 75 KB export: no datasource, no library, no key, no token |

## 7.6 Security checklist

| | Item | Code-based | Low-code |
|---|---|---|---|
| 1 | No real personal data anywhere in the app, fixtures or screenshots | ✅ | ✅ |
| 2 | No credential, API key or token in the client | ✅ | ✅ |
| 3 | No `.env` file and no environment variable read at runtime | ✅ | ✅ (none to read) |
| 4 | All user input validated against an anchored pattern before use | ✅ | ✅ |
| 5 | All user-supplied text escaped on output | ✅ (React, verified) | ❌ the Text widget renders markup — finding X-01, §7.2.1 |
| 6 | No `eval`, no `dangerouslySetInnerHTML`, no dynamic HTML | ✅ | ✅ |
| 7 | No database and no query construction | ✅ | ✅ |
| 8 | No third-party connector granted access | ✅ | ✅ |
| 9 | Public sharing is deliberate and the data is safe to publish | ✅ | ✅ |
| 10 | Dependency versions pinned and auditable | ⚠️ pinned in `package-lock.json` and audited: 6 advisories found, all dev-only and unreachable from the deployed bundle; upgrade scheduled (§7.4) | ❌ platform version neither pinnable nor auditable |
| 11 | A change to production leaves an auditable record | ✅ commit history | ⚠️ pressing **Deploy** publishes immediately; what a Git sync would record is the generated JSON, not the source as written (L3) |
| 12 | Booking data cannot be modified from the interface | ✅ read-only table, frozen snapshot | ✅ table set to read-only |
| 13 | AI agent given no account, credential or write access | ✅ | ✅ |
| 14 | Imported templates / external content treated as untrusted | ✅ none imported | ✅ built from an empty app, no template imported |

Four items are worth stating rather than ticking.

**Item 5** is the one real failure in this review, and it is on the low-code
side: finding X-01 in §7.2.1. It passed in every functional test and failed the
moment the input was hostile rather than merely wrong.

**Item 10** is the only one that is not clean on the code-based side, and the
honest mark is a warning rather than a tick: six advisories exist, they are
argued down to "not reachable from the deployed artefact" rather than fixed,
and the upgrade is owed. On the low-code side the same item fails outright and
cannot be fixed from inside the platform — I cannot even produce the equivalent
of `npm audit`.

**Item 11** is weaker on the low-code side than the tick suggests: pressing
Deploy publishes immediately, and what a Git sync would record is generated
JSON rather than the source as written.

**Item 14** was easy here only because the app was built from scratch; a
community template would have brought in expressions nobody in this submission
has read.

\newpage
