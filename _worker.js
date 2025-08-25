/**
 * FINAL WORKER V3 - Crash-Proof Injection
 * This worker acts as a sanitizing proxy. It fetches the iframe content as text,
 * prepends a script to disable window.open(), and returns the result.
 * This method avoids HTMLRewriter to prevent crashes on malformed or minimal HTML.
 */

const PROXY_PREFIX = "/--proxy--/";

// This is our "shield". It disables the popup function.
const JAVASCRIPT_SHIELD = `<script>
  // Redefine window.open to do nothing. This is the core of the popup block.
  // When an ad script calls this, the function runs but produces no popup.
  window.open = () => null;
  // Some ad scripts use a different property; this helps block those too.
  document.open = () => null;
</script>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // If the request is for our proxy, sanitize it.
    if (url.pathname.startsWith(PROXY_PREFIX)) {
      return handleSanitizeRequest(request);
    }

    // Otherwise, serve the main site's assets as normal.
    return env.next.fetch(request);
  },
};

/**
 * Fetches the real iframe content and injects the JavaScript Shield.
 */
async function handleSanitizeRequest(request) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Proxy error: URL parameter is missing.", { status: 400 });
  }

  try {
    // Fetch the real iframe content.
    const originResponse = await fetch(targetUrl);

    // Read the entire body of the response as text.
    const originalBody = await originResponse.text();

    // Create the new body by prepending our shield.
    const newBody = JAVASCRIPT_SHIELD + originalBody;

    // Create a new response with our modified body.
    // It's crucial to pass through the original headers from the source.
    const newHeaders = new Headers(originResponse.headers);
    // Ensure the browser interprets our response as HTML.
    newHeaders.set("Content-Type", "text/html; charset=utf-8");

    return new Response(newBody, {
      status: originResponse.status,
      statusText: originResponse.statusText,
      headers: newHeaders,
    });

  } catch (error) {
    return new Response(`Proxy error: Could not fetch target URL. ${error.message}`, { status: 502 });
  }
}
