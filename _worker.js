/**
 * This file acts as a middleware for your entire Cloudflare Pages site.
 * It will intercept every request, rewrite iframe URLs, and sanitize their content.
 */

// The special path prefix to identify iframe requests that need sanitizing.
const PROXY_PREFIX = "/--proxy--/";

export default {
  // The 'env' object gives us access to '.next', which passes the request
  // on to the actual Pages asset (e.g., your index.html).
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // If the path is for our proxy, handle it with the sanitization logic.
    if (url.pathname.startsWith(PROXY_PREFIX)) {
      return handleSanitizeRequest(request);
    }

    // Otherwise, it's a normal request for a page on your site.
    // Let Pages get the asset first.
    const response = await env.next.fetch(request);

    const contentType = response.headers.get("Content-Type");
    // Only rewrite HTML files. Leave images, CSS, etc., alone.
    if (contentType && contentType.startsWith("text/html")) {
      return rewriteIframes(response);
    }

    return response;
  },
};

/**
 * A helper function to find and rewrite all iframe 'src' attributes.
 */
function rewriteIframes(response) {
  const rewriter = new HTMLRewriter().on("iframe", {
    element(element) {
      const originalSrc = element.getAttribute("src");
      // Make sure we don't accidentally rewrite an already-rewritten URL.
      if (originalSrc && !originalSrc.startsWith(PROXY_PREFIX)) {
        const encodedUrl = encodeURIComponent(originalSrc);
        element.setAttribute("src", `${PROXY_PREFIX}?url=${encodedUrl}`);
      }
    },
  });

  return rewriter.transform(response);
}

/**
 * Fetches content from an external URL, removes popup code, and returns it.
 */
async function handleSanitizeRequest(request) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response("URL parameter is missing for proxy.", { status: 400 });
  }

  // Fetch the real iframe content.
  const originResponse = await fetch(targetUrl);

  // Sanitize the content by removing popup-generating code.
  const rewriter = new HTMLRewriter()
    .on("a", {
      element(element) {
        if (element.getAttribute("target")) {
          element.removeAttribute("target");
        }
      },
    })
    .on("script", {
      text(textChunk) {
        if (textChunk.text.includes("window.open")) {
          textChunk.replace("// Popup script blocked by Bingqilin Sanitizer", { asHtml: true });
        }
      },
    });

  return rewriter.transform(originResponse);
}
