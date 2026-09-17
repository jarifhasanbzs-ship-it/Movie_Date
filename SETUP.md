# Setup — getting her answer into a Google Sheet

Takes about 5 minutes. Everything is free.

---

## Step 1 — Make the sheet

1. Go to [sheets.new](https://sheets.new) — a blank sheet opens.
2. Name it something like **Birthday Answers**.

You don't need to add any headers. The script does that on its own.

---

## Step 2 — Add the script

In that sheet: **Extensions → Apps Script**.

Delete whatever is in the editor, and paste this in:

```javascript
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // add the header row once
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Received', 'Answer', 'Movie', 'Dates', 'Time', 'Her local time']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var d = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date(),
      d.answer  || '',
      d.movie   || '',
      d.dates   || '',
      d.time    || '',
      d.sent_at || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}
```

Save it (the disk icon, or Ctrl+S).

---

## Step 3 — Deploy it

Click **Deploy → New deployment**.

- Click the gear icon next to "Select type" → choose **Web app**
- **Description:** anything, e.g. `birthday`
- **Execute as:** `Me`
- **Who has access:** `Anyone` ← this matters. Not "Anyone with Google account."

Click **Deploy**.

Google will ask you to authorize it. It will warn you the app isn't verified — that's
normal, it's your own script. Click **Advanced → Go to (your project name)** → **Allow**.

You'll get a **Web app URL** ending in `/exec`. Copy it.

---

## Step 4 — Paste it into the page

**Already done.** Your URL is in `assets/app.js` and has been tested —
it returned `{"ok":true}`.

If you ever redeploy and the URL changes, update that one line.

---

## Step 5 — Test it yourself first

**Do this before you send her the link.**

1. Open the page, click through: yes → pick a movie → pick a date → pick a time.
2. Check your sheet. A row should appear within a second or two.

If nothing shows up, open the browser console (F12) and look for a
`[birthday]` message — it will tell you whether it tried to send.

---

## Important

**The page has to be hosted online.** Opening `index.html` by double-clicking it
(a `file://` address) will not work — the browser blocks the request.

Easiest free option: go to [app.netlify.com/drop](https://app.netlify.com/drop)
and drag the whole `BdWishhh` folder onto the page. You get a live link in
about ten seconds. Send her that link.

Hosting also makes the blow-out-the-candle microphone work, which needs HTTPS.

---

## What you'll see in the sheet

| Received | Answer | Movie | Dates | Time | Her local time |
|---|---|---|---|---|---|
| 18/09/2026 21:04 | YES | Insidious: Out of Further | Sun, September 20 | 7:30 PM | 18/09/2026, 9:04:11 PM |
| 18/09/2026 21:30 | NO | — skipped the movie — | — none picked — | — none picked — | 18/09/2026, 9:30:02 PM |

You get a row whether she says yes or no, so you'll know either way.

### Optional: capture her own recommendation

The page also sends a `suggestion` field when she writes a film into the
"something else in mind?" box. To give it its own column, change the two
lines in your Apps Script to:

```javascript
sheet.appendRow(['Received','Answer','Movie','Dates','Time','Her pick','Her local time']);
sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
```

and add `d.suggestion || '',` to the `appendRow` just before `d.sent_at`.

Without this her answer still arrives — if she only writes one in, it simply
shows up in the Movie column.

---

## If you change the script later

Re-deploy with **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**.
Creating a brand new deployment instead gives you a different URL, and you'd have to
update `app.js` again.
