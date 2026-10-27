// Single switch for links that must not exist until the repository does.
export const REPO_LIVE = import.meta.env.PUBLIC_REPO_LIVE === 'true';
// The GitHub organization.
export const REPO_URL = 'https://github.com/ilorium-protocol';
// The protocol repository: the documents live at its root (README.md, manifest.md, genome/, specs/, ...).
export const SPECS_URL = REPO_URL + '/protocol';
// Where a document's source is read: blob at main (the tag protocol/1.0.0-draft.1 once it exists).
export const SPECS_BLOB = SPECS_URL + '/blob/main';
