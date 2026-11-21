/**
 * Lee el último commit publicado en GitHub para mostrar qué versión está online.
 */
export class VersionRepository {
  constructor({ repo, branch = 'main' }) {
    this.url = `https://api.github.com/repos/${repo}/commits/${branch}`;
  }

  /** @returns {Promise<{sha: string, date: Date}>} */
  async getLatest() {
    const res = await fetch(this.url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`GitHub HTTP ${res.status}`);
    const commit = await res.json();
    return { sha: commit.sha.slice(0, 7), date: new Date(commit.commit.committer.date) };
  }
}
