# msf-decoder

[![License](https://img.shields.io/badge/license-BSD_3--Clause-blue.svg?style=for-the-badge)](https://github.com/wouldadam/msf-decoder/blob/main/LICENCE.md)
[![Build](https://img.shields.io/github/actions/workflow/status/wouldadam/msf-decoder/main.yml?style=for-the-badge)](https://github.com/wouldadam/msf-decoder/actions)
[![Vite](https://img.shields.io/badge/Vite--blue.svg?style=social&logo=vite)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest--blue.svg?style=social&logo=Vitest)](https://vitest.dev/)
[![Svelte](https://img.shields.io/badge/Svelte--blue.svg?style=social&logo=svelte)](https://svelte.dev/)
[![daisyUI](https://img.shields.io/badge/daisyUI--blue.svg?style=social&logo=daisyUI)](https://daisyui.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS--blue.svg?style=social&logo=tailwind-css)](https://tailwindcss.com/)

An in-browser decoder for the [MSF](<https://en.wikipedia.org/wiki/Time_from_NPL_(MSF)>)
time signal. MSF is a 60kHz time signal broadcast from Anthorn, UK and receivable
across much of Europe. The time is based on time standards maintained by the
UK's National Physics Laboratory ([NPL](https://www.npl.co.uk/msf-signal)).

See it running [here](https://wouldadam.github.io/msf-decoder/).

<img src="./doc/animation.gif?raw=true" width="500">

## Design

msf-decoder uses the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
to implement the decode processing chain, mostly using custom worklets for each stage.

The user interface uses the [Svelte](https://svelte.dev/) framework with
[daisyUI](https://daisyui.com/) on top of [Tailwind CSS](https://tailwindcss.com/)
for styling.

## Build

The repo contains a `.devcontainer` configuration that describes the build env.

```bash
# Install dependencies and create a prod build
yarn
yarn build

# Preview the currently build prod build
yarn preview

# Run a hot-reloading dev build
yarn dev

# Run ts type checks
yarn types

# Run the tests in different ways and with coverage
yarn test
yarn test:ui
yarn test:watch
yarn test:coverage

# Run a hot-reloading storybook
yarn storybook

# Build a static storybook
yarn build-storybook
```

## Use

**Input**

You're going to need an input signal to decode. If you have you're own receiver
that can appear as an audio input it'll be selectable in the playback dropdown.
[vb-cable](https://vb-audio.com/Cable/) can help with getting things piped to
the right place.

<img src="./doc/playback.jpg?raw=true" width="500">

Alternatively, you can capture a signal from a publicly available source such
as [WebSDR](http://websdr.org/) and use a file as input.

**Carrier**

You'll then need to configure the carrier frequency so we know what to decode.
Either click on the carrier in the displays to the left or type the frequency
in the settings box on the right.

<img src="./doc/displays.jpg?raw=true" width="500">

**Decode**

The Time panel shows the current date/time based on all of the decoded data.

<img src="./doc/time.jpg?raw=true" width="500">

The Frames panel shows either the current or previously decoded frame (second).

<img src="./doc/frames.jpg?raw=true" width="500">

The fields for a frame change colors as we decode the signal:

- Orange means that we've started receiving bits for the field.

- Blue means we've received all of the bits for the field.

- Green means any validation has passed (such as parity checks) for the field.

If anything interesting happens, good or bad, it'll appear in the Events panel.

<img src="./doc/events.jpg?raw=true" width="500">
