# Commerce-Students feature pack

The `feature/site-upgrades` branch contains the requested feature work:

- Timed quiz with pause/resume, keyboard controls, saved quiz state and score history.
- Previous-year paper archive cards.
- Chapter search and filtering.
- Refined rounded logo in `assets/logo.svg`.

## Integration

`index.html` must load `features.js` after `app.js`:

```html
<script src="app.js"></script>
<script src="features.js"></script>
```

Routes: `#papers`, `#search`, and `#quiz`.
