const Parser = require("rss-parser");
const parser = new Parser();
import { readFile, writeFile } from "fs/promises";

(async () => {
  const feed = await parser.parseURL("https://teletype.in/rss/alteregor");

  const postsMarkdownString = feed.items
    .slice(0, 4)
    .reduce((acc: string, item: { title: string; link: string }) => {
      return `${acc}
- [${item.title}](${item.link})`;
    }, "");

  const newReadmeContents = (
    await readFile("README-template.md", "utf-8")
  ).replace(/\/\/posts/s, postsMarkdownString);

  await writeFile("README.md", newReadmeContents);
})();
