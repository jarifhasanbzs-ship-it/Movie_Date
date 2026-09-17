# Birthday Movie Date

A personalized birthday webpage that guides someone through a celebration, a movie-date invitation, date and time selection, and a final ticket-style confirmation.

## Features

- Cake-cutting intro with video, applause, confetti, music, and candle interaction
- Responsive birthday scenes with photos, animations, and decorative effects
- Movie selection for current and upcoming films
- Calendar date picker and whole-hour time selection
- Optional custom movie suggestion
- Response submission to a Google Sheet through Google Apps Script

## Project Structure

- `index.html` - page markup and birthday scenes
- `assets/app.js` - interactions, movie data, calendar, and response submission
- `assets/style.css` - visual design and responsive styles
- `assets/` - photos, video, and music used by the page
- `SETUP.md` - detailed Google Sheets and Apps Script deployment instructions

## Run Locally

This is a static site and does not require a build step or package installation. From the project directory, start any static file server, for example:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000> in a browser.

Opening `index.html` directly with a `file://` URL may prevent the Google Sheets request and microphone features from working.

## Google Sheets Responses

The page sends selected answers to the `SHEET_URL` constant in `assets/app.js`. To configure or redeploy the endpoint, follow [SETUP.md](SETUP.md).

The deployed Apps Script must be available to anyone who has the link. Keep the endpoint private if the collected responses contain personal information.

## Deployment

Upload the entire project folder to a static host such as Netlify, GitHub Pages, or another static web server. Keep the `assets` folder beside `index.html`; the page depends on those relative paths.
