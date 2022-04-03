<?php

require_once __DIR__ . '/vendor/autoload.php';

$feed = Feed::loadRss('https://teletype.in/rss/alteregor')->toArray();

$recentPosts = array_slice(array: $feed['item'], offset: 0, length: 4);

$postsString = array_reduce(
    array: $recentPosts,
    callback: fn($acc, $post) => $acc . sprintf("\n- [%s](%s)", $post['title'], $post['link']),
);

$content = preg_replace(
    pattern: '#//posts#s',
    replacement: $postsString,
    subject: file_get_contents('README-template.md')
);

file_put_contents('README.md', $content);
