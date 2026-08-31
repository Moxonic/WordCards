# WordCards

[![Netlify Status](https://api.netlify.com/api/v1/badges/c6eb9abe-658d-4b0f-87ae-e4f94185274c/deploy-status)](https://app.netlify.com/projects/mywordcards/deploys)

A vocabulary trainer: flip cards, swipe to grade yourself, and let spaced
repetition decide when each word comes back.

- **Google sign-in + cloud sync** (Firebase Auth + Firestore) — cards and review
  progress follow your account across devices.
- **Swipe review** — tap a card to flip, swipe **right** if you remember it
  (longer interval), **left** to repeat it soon. Scheduling uses **Leitner
  boxes** (`src/lib/leitner.js`, intervals 1 / 2 / 4 / 7 / 14 days).
- **Manual entry** — the `+` button adds a card by hand.
- **Companion Chrome extension** (`extension/`) — pushes words you translate on
  `translate.google.com` into your account automatically (best-effort; Google's
  markup is unstable).

## First-time setup

You must create a Firebase project and (for the extension) one OAuth client.
**See [`SETUP.md`](./SETUP.md).** Then:

```bash
cp .env.example .env      # fill in your Firebase web config
npm install
npm start
npm test                  # runs the Leitner unit tests
```

## Deploy (Netlify)

Netlify builds on every push — build settings live in [`netlify.toml`](./netlify.toml)
(`npm run build` → `build/`, with an SPA redirect). You don't build locally.

Two one-time steps in the dashboards:

1. **Netlify → Site settings → Environment variables** — add all six
   `REACT_APP_FIREBASE_*` values (`.env` is gitignored, so the build has none).
2. **Firebase → Authentication → Settings → Authorized domains** — add the
   `*.netlify.app` domain (and any custom domain) or Google sign-in fails with
   `auth/unauthorized-domain`.

---

## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
