# 4. Task #04 — The low-code solution

## 4.1 Platform chosen

**Appsmith Cloud**, free plan, no purchase. It was chosen over the other
suggested builders for three reasons that matter to this comparison:

1. it has a real expression language and a JavaScript object, so the same rules
   can be stated rather than approximated;
2. a published app gets a URL that can be opened without an account, which is
   what the submission asks for;
3. it can **export** the application, so portability can be examined as evidence
   instead of guessed at.

A visual builder with no expression language was rejected early: it could not
have expressed the half-open overlap rule, and the comparison would have been
between a checker and a mock-up.

## 4.2 How it was assembled

Ten widgets on one canvas — two text inputs, a switch, a button, four text
widgets for the verdict, the message and the reason metadata, and a read-only
table for the existing bookings. One JS Object named `Rules` holds the whole
decision. The widgets carry no logic of their own beyond the bindings listed in
`low-code/appsmith/README.md`; the button stores a result and the text
widgets read it:

```
CheckBtn.onClick  →  {{ storeValue('result',
       Rules.check(StartTime.text, Duration.text, BlockedSwitch.isSwitchedOn)) }}

Message.text      →  {{ appsmith.store.result ? appsmith.store.result.message : '…' }}
BookingsTable.data→  {{ Rules.bookingRows() }}
```

The whole of `Rules` is in Appendix B, and the file pasted into the platform is
`low-code/appsmith/JSObject_Rules.js` in the repository — the same bytes, which
is what makes §5.3 possible.

![Figure 4.1 — the Appsmith editor with the `Rules` JS Object open. The entire decision lives in this one file; the widgets hold only bindings.](report/img/lc-editor.png)

![Figure 4.2 — the published low-code app.](report/img/lowcode-T1.png)

![Figure 4.3 — the low-code app at mobile width. The layout stacks correctly, but the platform truncates the labels and the button text rather than wrapping them (L6).](report/img/lc-mobile.png)

## 4.3 Requirements the platform could not implement as the code-based one does

These are limitations observed while building, not opinions about the product.

| # | Requirement | What happened | Consequence |
|---|---|---|---|
| L1 | **One definition of each rule** | The platform cannot import the project's TypeScript modules. The fixtures, the overlap predicate and all seven message strings had to be **restated** inside the JS Object. | Two copies of the rules now exist. Nothing but the parity test in §5.3 keeps them in step; a change made in one place is silently absent from the other. |
| L2 | **Unit tests inside the platform** | Appsmith has no test runner. There is no way to assert T1–T8 from within the app. | The eight low-code runs are **manual UI runs**, and the automated check of the same logic runs outside the platform (§5.3). This is the weakest point of the low-code track and is labelled as such everywhere it is used. |
| L3 | **Review of a change as a diff** | The reviewable artefact is a generated application JSON, and the platform **rewrites the source before storing it**. Measured on the export: all 31 occurrences of `this.` in the pasted object became `Rules.`, and every ES6 method shorthand became `function (…)`. The layout is stored twice, as `unpublishedPage` and an identical `publishedPage`. | A one-line rule change is not a one-line diff. The text under review is not the text that was written. |
| L4 | **Running without the vendor** | The 75 KB export contains no `<html>`, no `<script>`, no stylesheet and no bundle — only widget descriptors, layout coordinates and function bodies, against `clientSchemaVersion 2.0 / serverSchemaVersion 13.0`. | The file describes an app; it is not one. The low-code solution cannot run anywhere except Appsmith, and only against a compatible schema version. |
| L5 | **Type checking** | Expressions are evaluated at runtime; a misspelt field in a binding produces an empty value on screen rather than a build failure. | A whole class of errors moves from build time to the user's screen. |
| L6 | **Labels on a narrow screen** | At 375 px the platform truncates rather than wraps: `Start time (HH…`, `Duration (min…`, and the button reads `Check a…`. The code-based solution reflows the same content into one column with nothing clipped. | AC6 is met in substance — the verdict and the message are fully readable — but the controls are not self-describing on a phone. |

### Observations recorded during the build

1. **Public sharing worked.** The control is labelled **Make application public** in the Share dialog, and the deployed app then opens in a private window with no sign-in. The same dialog states that invited users *"will have access to all applications in the workspace. For application-level access, try out our business plan"* — on the free plan, access is granted per workspace, not per application.
2. **Export produces** `Smart Campus Room Checker (low-code).json`, 75,565 bytes.
3. **Git / version control:** the app settings carry a **Connect Git** control next to an environment selector reading *Production*, so version control is offered on the account; it was not connected for this submission. The export itself carries a `gitSyncId` on all seven function entities and on the page, so the format is built for Git synchronisation. App Settings also offers **Import — update app by importing file**, which is the route back from an export.
4. **The export is a description, not an application** — see L4 above and `evidence/appsmith-export-analysis.txt`.
5. **Clock times** are in §6.3.

## 4.4 Labels: what is simulated or incomplete on the low-code side

The practice asks for this to be stated plainly rather than buried.

- **The eight low-code results in §5.2 are manual UI observations.** They were
  produced by typing into the published app and reading the screen. They are
  evidenced by screenshots, not by a test runner.
- **The automated low-code run in §5.3 does not exercise the platform.** It
  imports the JS Object source and runs the same eight cases in Node. It proves
  the *rules* are identical; it proves nothing about Appsmith's widgets,
  bindings, storage or hosting.
- **The security finding in §7.2.1 was observed, not inferred.** It is a screenshot of the published app, and the conclusion drawn from it is limited to what the screenshot shows.
- **Nothing else is simulated.** The published app is a real, working,
  publicly reachable application, and the exported JSON is the platform's own
  artefact.

\newpage
