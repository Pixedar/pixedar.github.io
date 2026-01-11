# pixedar.github.io (Hover Video Cards Portfolio)

This repo is a GitHub Pages-ready version of the v0 "Interactive Portfolio Gallery with Hover Video Cards" template.

## Where to edit your projects/cards
Open:
- `components/works-gallery.tsx`

Edit the `projects` array (title, category, thumbnail, video URL).

### Add your own images/videos
Put files in:
- `public/` (e.g. `public/videos/my-loop.mp4`, `public/thumbs/my-thumb.jpg`)

Then reference them like:
- `thumbnail: "/thumbs/my-thumb.jpg"`
- `video: "/videos/my-loop.mp4"`

## Deploy to GitHub Pages
1. Create a repo named **pixedar.github.io** under your GitHub account.
2. Upload this code to the repo (main branch).
3. In GitHub: **Settings → Pages → Build and deployment → Source = GitHub Actions**
4. Push a commit. The Action "Deploy to GitHub Pages" will publish your site.

If your repo is a user site repo (`pixedar.github.io`) it will deploy at:
- https://pixedar.github.io


## Linking cards to pages
Cards use `href` fields in `components/works-gallery.tsx`.

If you want to use the **Academic Project Page Template** unchanged, put it in `public/pubs/<slug>/index.html` and set the card href to `/pubs/<slug>/`.
