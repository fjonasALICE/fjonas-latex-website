# Florian Jonas' Personal Website

This repository contains the source code for my personal academic website. It is a fork of the [latex-css](https://github.com/vincentdoerig/latex-css) project by Vincent Dörig.

## Modifications

I have heavily modified the original template to include:
- **Dynamic Content Loading**: Scripts to load CV, contact info, and bibliography from YAML/JSON/BibTeX files (`cv-loader.js`, `contact-loader.js`, `bib-loader.js`).
- **INSPIRE-HEP Integration**: Fetching publication details (abstracts, citations, journal, title etc.) directly from INSPIRE-HEP.
- **UI Enhancements**: A moving sidebar, dark mode toggle, and improved mobile navigation.

## Original Project: LaTeX.CSS

> [LaTeX.css](https://github.com/vincentdoerig/latex-css) is a minimal, almost class-less CSS library which makes any website look like a LaTeX document.

## Getting Started

### Using the `<link>` tag

Add the following code in the head of your project.

```html
<link rel="stylesheet" href="https://latex.vercel.app/style.min.css" />
```

or use a CDN like Unpkg:

```html
<link rel="stylesheet" href="https://unpkg.com/latex.css/style.min.css" />
```

### Using NPM/Yarn

NPM:

```bash
npm install latex.css
```

Yarn:

```bash
yarn add latex.css
```

Add any optional classnames to elements with special styles (author subtitle, abstract, lemmas, theorems, etc.). A list of supported class-based elements can be found [here](https://latex.vercel.app/#class-based-elements).

## Languages

The labels of theorems, definitions, lemmas and proofs can be changed to other [supported languages](lang) by including the following snippet in addition to the main CSS file.

```html
<link rel="stylesheet" href="https://latex.vercel.app/lang/es.css" />
```

and changing the html `lang` attribute:

```html
<html lang="es">
```

Have a look at the [language support page](https://latex.vercel.app/languages) for more info and a demo of the different languages.

## Contributing

Contributions, feedback and issues are welcome. Feel free to fork, comment, critique, or submit a pull request.

## Acknowledgements

This project is based on Vincent Dörig's project [latex-css](https://github.com/vincentdoerig/latex-css).

Most of the CSS reset is based on Andy Bell's [Modern CSS Reset](https://hankchizljaw.com/wrote/a-modern-css-reset/).

The sample [HTML5 markup test page](https://latex.vercel.app/elements) is based on [html5-test-page](https://github.com/cbracco/html5-test-page) by @cbracco.

The idea of sidenotes was taken and adpated from [Tufte CSS](https://edwardtufte.github.io/tufte-css/).

## License

This project is open source and available under the [MIT License](LICENSE).
