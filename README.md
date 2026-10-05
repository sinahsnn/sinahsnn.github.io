# sinahsnn.github.io

Personal website of Mohammadsina Hassannia, published with GitHub Pages at
https://sinahsnn.github.io/.

## Files

- `index.html` holds all of the page content.
- `assets/style.css` holds the design: colors, type, and layout.
- `assets/site.js` draws the ECG rhythm strip in the header.

There is no build step. Edit the files and push to `main`, and GitHub Pages
publishes the change.

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
