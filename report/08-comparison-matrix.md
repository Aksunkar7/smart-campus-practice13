# 8. Comparison matrix and recommendation

## 8.1 The matrix

Every cell points at the evidence that produced it.

| Criterion | Code-based | Low-code |
|---|---|---|
| **Functional tests** | **8 / 8** — automated, 24 assertions, 0.56 s (§5.3) | **8 / 8** — manual UI runs with screenshots (§5.2); the same rule logic also passes 8/8 when executed outside the platform, and the visible sentence matches character for character in all seven request cases (§5.3) |
| **Build and repair time** | **25** min total, of which 0 min implementation — the code was reviewed, not authored (§6.3); **0** repair cycles; build 0.80 s, tests 0.56 s | **45** min total, of which 20 min implementation and 5 min debugging; **2** repair cycles, both found by eye rather than by a test (§5.4); no build step and no test step exist |
| **Customization** | unlimited and cheap: any layout, any wording, any rule. The AC6 field-level feedback and the frozen AC5 snapshot both required code the platform has no concept of | high for anything the widget set covers, and a wall beyond it. The overlap rule only fitted because Appsmith has a JavaScript object; a builder without one could not have expressed it (§4.1) |
| **Security controls** | I own every control and every duty — and the audit proved the duty is real: six advisories, all dev-only, an upgrade owed (§7.4). Escaping verified, no secrets, an auditable commit per change | the platform owns most controls and most duties. Good defaults — rendering is escaped, `datasourceList` and `customJSLibList` are both empty, so there is no credential to leak — but the defaults are not all good: the Text widget renders user input as markup where React escapes it (finding X-01, §7.2.1). I also cannot pin the platform version, cannot run anything resembling `npm audit`, and access on the free plan is granted per workspace rather than per application (§7.3, §7.4) |
| **Versioning / portability** | Git history, branches, blame, pull requests; the build is plain HTML/CSS/JS and runs on any static host | Git is offered — the app settings carry a **Connect Git** control next to an environment selector reading *Production*, so version control is offered on the account; it was not connected for this submission. But the 75 KB export contains no markup, no stylesheet and no bundle, and the platform rewrites the stored source, so what a diff would show is generated JSON, and the app runs only inside Appsmith (L3, L4) |
| **Ongoing cost** | €0 in money: public repository, GitHub Pages, no server, no runtime. The cost is engineering time — somebody must keep 99 dependencies current, and the audit in §7.4 shows that bill already coming due | €0 in money on the free plan (5 users, 5 workspaces), and no maintenance of dependencies at all. The cost is exposure: the plan's limits and the platform's behaviour are the vendor's to change, not mine (§7.4) |

## 8.2 What the two tracks actually proved

They agree. That is the first finding and it is not trivial: a visual builder
with a real expression language reproduced a rule engine that took five
practices to get right, character for character, in an afternoon (§5.3).
Anyone claiming low-code "cannot do business rules" is contradicted by the
equivalence block.

They diverge on everything that happens *after* the first working version.
The code-based solution answers "is it still correct?" in 0.56 s and will keep
answering it after every change. The low-code solution answers the same
question only if a person re-runs eight cases by hand and looks carefully
(L2). On a one-screen checker that is a few minutes; on a rule that changes
each semester it is the whole maintenance budget.

The security review found what the test table could not. All eight functional
cases passed on both sides, and then the first hostile input — not merely an
invalid one — separated them: the same AC6 message that React escapes is
rendered as markup by the Text widget (X-01, §7.2.1). Eight passing cases said
the two solutions were equivalent; they were equivalent on *correct* behaviour
and not on *safe* behaviour. That is an argument for the security review as a
separate activity, not a corollary of testing.

The duplication introduced by L1 is the sharpest single risk. There are now two
statements of the half-open overlap rule — one in `bookingRules.ts`, one in the
JS Object. The parity test catches a divergence, but **only because the JS
Object was kept in the repository as a file**. A team that edits the rule in
the Appsmith editor and never copies it back has no such safety net, and the
two will drift apart quietly.

## 8.3 Recommendation

**Keep the code-based solution as the system of record for the booking rules,
and use the low-code platform for the parts of the Smart Campus product that
are screens rather than rules.**

The reasoning, in the order the evidence supports it:

1. **The rules are the asset, and they are testable only on the code-based
   side.** Six acceptance criteria, five practices of defect history, and one
   boundary (`[start, end)`) that has already been got wrong once and caught by
   a test. That history is the argument: this rule set needs a test runner, and
   the platform does not have one.
2. **Anything that echoes user input belongs on the side that escapes by
   default.** X-01 is harmless in this app and would not be in one with real
   users, and nothing in the platform warned about it.
3. **Security duties follow the dependency.** The code-based side can pin,
   audit and patch; the low-code side cannot (§7.4). For a rule engine that is
   the right way round.
4. **But the low-code result was genuinely good**, and the honest conclusion is
   not "code wins". For a form over fixed data, assembled once and changed
   rarely — a room-request form, an admin view of the bookings, a feedback
   page — the low-code track reached a published, public, working application
   with no build pipeline, no hosting decision and no dependency to maintain.
   Refusing that on principle would cost more than it saves.
5. **The split point is "does it have rules that can be wrong?"** If yes, it
   belongs in the repository, behind tests. If it is a screen over data that
   the rules already decided, the builder is the cheaper home for it.

What I would do next if this were real: expose the code-based checker as a
small HTTP endpoint and have the low-code app call it, so that there is one
statement of the rules and the builder is used for what it is good at. That
removes L1 entirely and keeps the 0.56 s test run as the gate on every change.

\newpage
