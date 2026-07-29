import { messagesByCategory, names } from "./data.generated";

type CategorizedMessage = (typeof messagesByCategory)[string][number] & { category: string };

const messages: readonly CategorizedMessage[] = Object.entries(messagesByCategory).flatMap(([category, categoryMessages]) =>
  categoryMessages.map((message) => ({ ...message, category })),
);
const messageByHash = new Map(messages.map((message) => [message.hash, message]));
const numberToken = /XNUM([0-9,]*)X/;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Origin,X-Requested-With,Content-Type,Accept",
};

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function fillLine(template: string): string {
  let message = template
    .replaceAll("XNAMEX", randomItem(names))
    .replaceAll("XUPPERNAMEX", randomItem(names).toUpperCase())
    .replaceAll("XLOWERNAMEX", randomItem(names).toLowerCase());

  let match = numberToken.exec(message);
  while (match) {
    const value = match[1] || "999";
    let start = 1;
    let end = 999;
    const comma = value.indexOf(",");

    if (comma >= 0) {
      if (comma === 0) end = Number(value.slice(1));
      else if (comma === value.length - 1) start = Number(value.slice(0, -1));
      else {
        start = Number(value.slice(0, comma));
        end = Number(value.slice(comma + 1));
      }
    } else {
      end = Number(value);
    }

    if (start > end) end = start * 2;
    const number = Math.floor(Math.random() * (end - start + 1)) + start;
    message = message.replace(numberToken, String(number));
    match = numberToken.exec(message);
  }

  return message;
}

function textResponse(message: string, hash: string): Response {
  const body = message
    .replace(/&(amp|lt|gt|quot|#39);/g, (_match, entity: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[entity]!)
    .replaceAll("<br/>", "\n");

  return new Response(body, {
    headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8", "X-Message-Hash": hash },
  });
}

function jsonResponse(message: string, hash: string, category: string, url: URL): Response {
  return Response.json({
    category,
    hash,
    commit_message: message.replaceAll("\n", ""),
    permalink: `${url.protocol}//${url.host}/${hash}`,
  }, { headers: { ...corsHeaders, "X-Message-Hash": hash } });
}

function htmlResponse(message: string, hash: string): Response {
  return new Response(`<!doctype html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Commit Message Generator</title>
    <link rel="author" href="/humans.txt" />
    <style>
        body { font-family: 'Lucida Console', 'Courier New', monospace; font-size: 26pt; line-height: 1.2em; }
        #content { width: 760px; text-align: left; margin: 1em auto; }
        .permalink { font-size: .5em; color: #ddd; line-height: 1em; }
        .permalink a { text-decoration: none; color: inherit; }
        .permalink a:hover { text-decoration: underline; }
    </style>
    <meta name="description" content="${message}">
    <meta property="og:title" content="Commit Message Generator" />
    <meta property="og:description" content="${message}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.whatthecommit.com/${hash}" />
</head>
<body>
    <div id="content">
        <p>${message}</p>
        <p class="permalink">[<a href="/${hash}">permalink</a>]</p>
    </div>
</body>
<!-- Like what you see? https://github.com/ngerakines/commitment -->
</html>`, {
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "X-Message-Hash": hash },
  });
}

function route(pathname: string): { format: "html" | "json" | "text"; hash?: string } | undefined {
  if (pathname === "/") return { format: "html" };
  if (pathname === "/index.json") return { format: "json" };
  if (pathname === "/index.txt") return { format: "text" };

  const match = /^\/([a-z0-9]+)(?:\/(index\.json|index\.txt)|(\.json|\.txt))?$/.exec(pathname);
  if (!match) return undefined;

  return {
    hash: match[1],
    format: match[2]?.endsWith("json") || match[3] === ".json" ? "json" : match[2]?.endsWith("txt") || match[3] === ".txt" ? "text" : "html",
  };
}

export default {
  fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET" } });
    }

    const requestUrl = new URL(request.url);
    const selectedRoute = route(requestUrl.pathname);
    if (!selectedRoute) return new Response("Not Found", { status: 404 });

    let selected: CategorizedMessage | undefined;
    if (selectedRoute.hash) {
      selected = messageByHash.get(selectedRoute.hash);
    } else {
      const category = requestUrl.searchParams.get("category") ?? "legacy";
      const categoryMessages = messagesByCategory[category];
      if (!categoryMessages) {
        return new Response("Unknown category", { status: 400, headers: corsHeaders });
      }
      selected = { ...randomItem(categoryMessages), category };
    }
    if (!selected) return new Response("Not Found", { status: 404 });

    const message = fillLine(selected.text);
    const response = selectedRoute.format === "json"
      ? jsonResponse(message, selected.hash, selected.category, requestUrl)
      : selectedRoute.format === "text"
        ? textResponse(message, selected.hash)
        : htmlResponse(message, selected.hash);

    return request.method === "HEAD" ? new Response(null, response) : response;
  },
} satisfies ExportedHandler;
