# The low-code solution

The second implementation of the Smart Campus room availability checker,
assembled in **Appsmith Cloud** on the free plan. It answers the same six
acceptance criteria as the code-based solution, against the same fixtures, and
returns the same seven reason codes and the same message strings.

Published application:
<https://app.appsmith.com/app/smart-campus-room-checker-low-code/page1-6b05775c5441f3e820a02668>

## Files here

| Path | Role |
|---|---|
| `JSObject_Rules.js` | the whole decision, as pasted into the platform's `Rules` JS Object |
| `lowcode.parity.test.js` | the eight shared cases run against that file, plus a field-by-field equivalence check against the code-based solution |
| `export/` | the application export produced by the platform |

## How the application is put together

Ten widgets on one page. They carry no logic beyond the bindings below; every
verdict comes from `Rules`.

| Widget | Type | Purpose |
|---|---|---|
| `Title`, `Subtitle` | Text | heading and the fixture summary |
| `StartTime` | Input, single-line **text** | start time, `HH:MM` |
| `Duration` | Input, single-line **text** | duration in minutes |
| `BlockedSwitch` | Switch | the room-status control |
| `CheckBtn` | Button | runs the check |
| `Verdict` | Text | one word: Available / Unavailable / Invalid input |
| `Message` | Text | the sentence |
| `ReasonMeta` | Text | reason code and criterion |
| `BookingsTable` | Table, read-only | the existing bookings |

Both inputs are plain **text** widgets rather than number or time pickers. A
picker would have delegated part of AC6 to the widget, and the two
implementations would no longer be exercising the same validation.

### Bindings

```
CheckBtn.onClick
  {{ storeValue('result', Rules.check(StartTime.text, Duration.text, BlockedSwitch.isSwitchedOn)) }}

Verdict.text
  {{ appsmith.store.result ? (appsmith.store.result.available ? 'Available'
     : ((appsmith.store.result.ac === 'AC3' || appsmith.store.result.ac === 'AC4')
        ? 'Unavailable' : 'Invalid input')) : ' ' }}

Verdict.textColor
  {{ appsmith.store.result ? (appsmith.store.result.available ? '#2FBF71'
     : (appsmith.store.result.ac === 'AC3' || appsmith.store.result.ac === 'AC4'
        ? '#E4572E' : '#E8B931')) : '#FFFFFF' }}

Message.text
  {{ appsmith.store.result ? appsmith.store.result.message
     : 'Enter a start time and a duration, then choose Check availability.' }}

ReasonMeta.text
  {{ appsmith.store.result ? ('reason code: ' + appsmith.store.result.reasonCode
     + '   ·   criterion: ' + appsmith.store.result.ac) : ' ' }}

BookingsTable.tableData
  {{ Rules.bookingRows() }}
```

`BookingsTable` has row editing and row insertion switched off: AC5 says a
check never changes booking data, and an editable grid would allow exactly that
from the interface.

## Rebuilding it from this repository

1. Create an empty application in Appsmith.
2. Add a JS Object named exactly **`Rules`** and replace its contents with
   `JSObject_Rules.js`. Every binding resolves against that name.
3. Add the ten widgets above, naming each one as listed, and apply the bindings.
4. Deploy, then enable public access from the Share dialog.

Alternatively, App Settings → **Import** accepts the file in `export/` and
recreates the application from it.

## Known limitations of this implementation

Recorded during the build and discussed in §4.3 and §7.2.1 of the report.

- The platform cannot import the project's TypeScript modules, so the fixtures,
  the overlap predicate and every message string are **restated** here. Two
  definitions of the same rules now exist; `lowcode.parity.test.js` is the only
  thing keeping them in step.
- There is no test runner inside the platform. The eight cases were run by hand
  against the published application.
- The platform rewrites the stored source: `this.` becomes `Rules.`, and ES6
  method shorthand is expanded. What a version-control diff would show is not
  the text that was written.
- The export describes the application; it is not one. It runs only inside
  Appsmith.
- At 375 px the platform truncates widget labels and the button text rather
  than wrapping them.
- **Finding X-01:** the Text widget renders bound values as markup rather than
  escaping them, so user input echoed into a message is an output-encoding
  surface. The code-based renderer escapes by default. Do not bind raw user
  input to a Text widget.
