# sinahsnn.github.io

Personal website of Mohammadsina Hassannia, published with GitHub Pages at
https://sinahsnn.github.io/.

## Files

- `index.html` holds all of the page content.
- `assets/style.css` holds the design: colors, type, and layout.
- `assets/site.js` draws the animated multimodal recording in the header.
- `assets/figures/` holds the paper and poster figures.

There is no build step. Edit the files and push to `main`, and GitHub Pages
publishes the change.

## Tabs

The page is split into tabs: About, Research, Publications, Experience,
Projects, Awards and skills, and Contact. Each tab is an element with a
`data-panel` attribute, and `assets/site.js` shows one at a time. Links
such as `#publications` or `#pub-ecg-bench` open the right tab, so pages
can be linked directly. In Projects, the buttons at the top switch between
the three project areas (`data-group`). Without JavaScript every tab is
shown in one long page.

## Editing content

Each section of `index.html` is marked by its `id`: `about`, `research`,
`publications`, `experience`, `projects`, `more`, and `contact`. To add a
publication, copy one `<li class="pub">` block inside the `publications`
section and change its text and link.

## Diagrams

Each research project and code project has a small flow diagram: a
`<figure class="flow">` holding a list of tiles (`<li class="node">`) joined by
labeled arrows (`<li class="op">`). The tile drawings are SVG symbols defined
once near the top of `index.html` (ids starting with `g-`) and reused with
`<use href="#g-...">`. To change a diagram, edit the labels in its list or
point a tile at a different symbol.
