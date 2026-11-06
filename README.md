# Minimal Mistakes remote theme starter

Click [**Use this template**](https://github.com/mmistakes/mm-github-pages-starter/generate) button above for the quickest method of getting started with the [Minimal Mistakes Jekyll theme](https://github.com/mmistakes/minimal-mistakes).

Contains basic configuration to get you a site with:

- Sample posts.
- Sample top navigation.
- Sample author sidebar with social links.
- Sample footer links.
- Paginated home page.
- Archive pages for posts grouped by year, category, and tag.
- Sample about page.
- Sample 404 page.
- Site wide search.

Replace sample content with your own and [configure as necessary](https://mmistakes.github.io/minimal-mistakes/docs/configuration/).

---

## Troubleshooting

If you have a question about using Jekyll, start a discussion on the [Jekyll Forum](https://talk.jekyllrb.com/) or [StackOverflow](https://stackoverflow.com/questions/tagged/jekyll). Other resources:

- [Ruby 101](https://jekyllrb.com/docs/ruby-101/)
- [Setting up a Jekyll site with GitHub Pages](https://jekyllrb.com/docs/github-pages/)
- [Configuring GitHub Metadata](https://github.com/jekyll/github-metadata/blob/master/docs/configuration.md#configuration) to work properly when developing locally and avoid `No GitHub API authentication could be found. Some fields may be missing or have incorrect data.` warnings.


### Animated page openings

Home keeps the post archive and adds mixed ASCII sharks (classic, hammerhead, mako and thresher); About keeps the biography and adds an interactive koi pond. The shared light switch controls both scene backgrounds. Appearance and pause choices are stored separately for each scene. Reduced-motion preferences start the scenes paused, and animations suspend outside the viewport or in hidden tabs.

`_includes/page-scene.html` supplies the controls; `assets/js/page-scene.js` connects them to the same-origin renderers in `assets/scenes/`. Each renderer is isolated in its own frame to preserve its coordinate system and avoid changing the surrounding Jekyll page. Attribution is in `assets/scenes/ATTRIBUTION.txt`. The original Home layout continues to handle posts and pagination.
