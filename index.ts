import axios from "axios";
const Parser = require("rss-parser");
import { readFile, writeFile } from "fs/promises";

const formatStarsCount = (count: number) => {
  if (count < 1000) {
    return `⭐${count}`;
  }
  return `⭐${(Math.round((count / 1000) * 10) / 10).toFixed(1)}k+️`;
};

const contributedRepositories = [
  {
    url: "mobxjs/mobx",
    text: `[11 contributions](https://github.com/mobxjs/mobx/pulls?q=is%3Apr+is%3Aclosed+author%3Akubk). Last PR - [Replace 'any' with a generic in Set](https://github.com/mobxjs/mobx/pull/3338)`,
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
    url: "botman/botman",
    text: `[Add PSR-11 ContainerInterface](https://github.com/botman/botman/pull/714)`,
  },
  {
    url: "gios/gzipper",
    text: `[Add --include flag](https://github.com/gios/gzipper/pull/20)`,
  },
  {
    url: "francisrstokes/construct-js",
    text: `[Use TS assertion signature to avoid type casting](https://github.com/francisrstokes/construct-js/pull/30)`,
  },
  {
    url: "nikolalsvk/pusher-js-mock",
    text: `[Add unbind_all() method](https://github.com/nikolalsvk/pusher-js-mock/pull/35)`,
  },
  {
    url: "mobxjs/mobx-angular",
    text: `[10 contributions](https://github.com/mobxjs/mobx-angular/pulls?q=is%3Apr+is%3Aclosed+author%3Akubk). Last PR - [Replace Karma with Jest, run tests on CI](https://github.com/mobxjs/mobx-angular/pull/101)`,
  },
  {
    url: "DefinitelyTyped/DefinitelyTyped",
    text: `[Add barRadius to the list of available options](https://github.com/DefinitelyTyped/DefinitelyTyped/pull/40737)`,
  },
];

const replaceReadmeContent = async (
  replacements: Array<{ search: RegExp; replaceWith: string }>
) => {
  let readmeContents = await readFile("README-template.md", "utf-8");

  for (const { search, replaceWith } of replacements) {
    readmeContents = readmeContents.replace(search, replaceWith);
  }

  await writeFile("README.md", readmeContents);
};

(async () => {
  const rssParser = new Parser();
  const feed = await rssParser.parseURL("https://teletype.in/rss/alteregor");

  const postsMarkdownString = feed.items
    .slice(0, 4)
    .reduce((acc: string, item: { title: string; link: string }) => {
      return `${acc}
- [${item.title}](${item.link})`;
    }, "");

  let newReposContents = "";
  for (const repo of contributedRepositories) {
    const [, repoName] = repo.url.split("/");
    const result = await axios
      .get<{ stargazers_count: number }>(
        `https://api.github.com/repos/${repo.url}`
      )
      .then((res) => res.data);

    newReposContents += `- ${repoName} (${formatStarsCount(
      result.stargazers_count
    )}) - ${repo.text} (merged)\n`;
  }

  await replaceReadmeContent([
    { search: /\/\/repos/s, replaceWith: newReposContents },
    { search: /\/\/posts/s, replaceWith: postsMarkdownString },
  ]);
})();
