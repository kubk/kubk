import { readFile, writeFile } from "fs/promises";

const replaceReadmeContent = async (
  replacements: Array<{ search: RegExp; replaceWith: string }>,
) => {
  let readmeContents = await readFile("README-template.md", "utf-8");

  for (const { search, replaceWith } of replacements) {
    readmeContents = readmeContents.replace(search, replaceWith);
  }

  await writeFile("README.md", readmeContents);
};

const formatStarsCount = (count: number) => {
  if (count < 1000) {
    return `⭐${count}`;
  }
  return `⭐${(Math.round((count / 1000) * 10) / 10).toFixed(1)}k+️`;
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Request to ${url} failed with ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as T;
};

const getMobxPrCount = async (): Promise<number> => {
  const res = await fetchJson<{ total_count: number }>(
    "https://api.github.com/search/issues?q=is:pr+is:closed+author:kubk+repo:mobxjs/mobx",
  );
  return res.total_count;
};

const contributedRepositories = [
  {
    url: "mobxjs/mobx",
    text: ``, // populated dynamically
  },
  {
    url: "phpstan/phpstan",
    text: `[Detect enum duplicated values](https://github.com/phpstan/phpstan-src/pull/2371)`,
  },
  {
    url: "katspaugh/wavesurfer.js",
    text: `[Waveform with rounded bars](https://github.com/katspaugh/wavesurfer.js/pull/1760)`,
  },
  {
    url: "ts-essentials/ts-essentials",
    text: `[Simplify Merge type](https://github.com/ts-essentials/ts-essentials/pull/136)`,
  },
  {
    url: "assistant-ui/assistant-ui",
    text: `[Add support for dynamic headers in EdgeChatAdapter](https://github.com/assistant-ui/assistant-ui/pull/1711)`,
  },
  {
    url: "francisrstokes/construct-js",
    text: `[Use TS assertion signature to avoid type casting](https://github.com/francisrstokes/construct-js/pull/30)`,
  },
  {
    url: "mobxjs/mobx-angular",
    text: `[10 PRs](https://github.com/mobxjs/mobx-angular/pulls?q=is%3Apr+is%3Aclosed+author%3Akubk). Last PR - [Replace Karma with Jest, run tests on CI](https://github.com/mobxjs/mobx-angular/pull/101)`,
  },
];

const getRepositoriesAsString = async () => {
  // Fetch MobX PR count dynamically
  const mobxPrCount = await getMobxPrCount();
  const mobxRepo = contributedRepositories.find((r) => r.url === "mobxjs/mobx")!;
  mobxRepo.text = `[${mobxPrCount} PRs](https://github.com/mobxjs/mobx/pulls?q=is%3Apr+is%3Aclosed+author%3Akubk). Example PR - [Fix type inference of the action callback arguments](https://github.com/mobxjs/mobx/pull/2213)`;

  // Fetch all repository data with star counts first
  const reposWithStars = await Promise.all(
    contributedRepositories.map(async (repo) => {
      console.log("Processing GitHub repo:", repo.url);
      const [, repoName] = repo.url.split("/");
      const result = await fetchJson<{
        stargazers_count: number;
      }>(`https://api.github.com/repos/${repo.url}`);

      return {
        ...repo,
        repoName,
        stars: result.stargazers_count,
        formattedStars: formatStarsCount(result.stargazers_count),
      };
    }),
  );

  // Sort repositories by star count (descending)
  const sortedRepos = reposWithStars.sort((a, b) => b.stars - a.stars);

  // Format the sorted repositories as string
  let newReposContents = "";
  for (const repo of sortedRepos) {
    newReposContents += `- **${repo.repoName}** (${repo.formattedStars}) - ${repo.text} (merged)\n`;
  }

  return newReposContents;
};

(async () => {
  await replaceReadmeContent([
    { search: /\/\/repos/s, replaceWith: await getRepositoriesAsString() },
  ]);
})();
