import axios from "axios";
import Parser from "rss-parser";
import { readFile, writeFile } from "fs/promises";
import puppeteer, { Browser } from "puppeteer";

const replaceReadmeContent = async (
  replacements: Array<{ search: RegExp; replaceWith: string }>
) => {
  let readmeContents = await readFile("README-template.md", "utf-8");

  for (const { search, replaceWith } of replacements) {
    readmeContents = readmeContents.replace(search, replaceWith);
  }

  await writeFile("README.md", readmeContents);
};

const getArticlesAsString = async (browser: Browser) => {
  const rssParser = new Parser<any>();
  const feed = await rssParser.parseURL("https://teletype.in/rss/alteregor");

  const articles = feed.items.slice(0, 5);
  // .slice(0, 2);

  const scrapedArticles = await Promise.all(
    articles.map(async (article: any) => {
      const articleInfo = await scrapeTeletypeArticleInfo(
        browser,
        article.link
      );
      return `- [${article.title}](${article.link})${
        articleInfo ? ` (${articleInfo})` : ""
      }`;
    })
  );

  return scrapedArticles.join("\n");
};

const formatStarsCount = (count: number) => {
  if (count < 1000) {
    return `⭐${count}`;
  }
  return `⭐${(Math.round((count / 1000) * 10) / 10).toFixed(1)}k+️`;
};

const contributedRepositories = [
  {
    url: "mobxjs/mobx",
    text: `[23 PRs](https://github.com/mobxjs/mobx/pulls?q=is%3Apr+is%3Aclosed+author%3Akubk). Example PR - [Fix type inference of the action callback arguments](https://github.com/mobxjs/mobx/pull/2213)`,
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
    url: "botman/botman",
    text: `[Add PSR-11 ContainerInterface](https://github.com/botman/botman/pull/714)`,
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
  let newReposContents = "";
  for (const repo of contributedRepositories) {
    console.log("Processing GitHub repo:", repo.url);
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

  return newReposContents;
};

async function scrapeTeletypeArticleInfo(
  browser: Browser,
  url: string
): Promise<string | null> {
  try {
    const page = await browser.newPage();
    console.log("Scraping:", url);
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 * 4 });

    const articleInfo = await page.evaluate(() => {
      const elements = document.querySelectorAll(".articleInfo-item");
      // @ts-expect-error;
      const text = elements[3]?.innerText;
      return text ? text.replace("\n", "") : null;
    });
    console.log("Scraped:", articleInfo);

    return articleInfo;
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  await replaceReadmeContent([
    { search: /\/\/repos/s, replaceWith: await getRepositoriesAsString() },
    { search: /\/\/posts/s, replaceWith: await getArticlesAsString(browser) },
  ]);
  await browser.close();
})();
