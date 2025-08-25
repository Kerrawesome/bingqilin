/**
 * FINAL WORKER - "JavaScript Shield" Technique
 * This worker acts as a sanitizing proxy. It intercepts requests for iframes,
 * fetches the content, and injects a script that disables the window.open function,
 * effectively blocking all popups without using the 'sandbox' attribute.
 */

const PROXY_PREFIX = "/--proxy--/";

// This is our "shield". A tiny script that redefines window.open to do nothing.
const JAVASCRIPT_SHIELD = `
<script>
  // Override the popup function. When ad scripts call it, it will now do nothing.
  window.open = function(url, name, features) {
    console.log('Bingqilin Shield: Blocked a popup attempt to ->', url);
    // Return null to prevent any further action.
    return null;
  };
</script>
`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // If the request is for our proxy, sanitize it.
    if (url.pathname.startsWith(PROXY_PREFIX)) {
      return handleSanitizeRequest(request);
    }

    // Otherwise, it's a normal request for your site. Serve the asset.
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
    return new Response("URL parameter is missing for proxy.", { status: 400 });
  }

  // Fetch the real iframe content.
  const originResponse = await fetch(targetUrl);

  // Use HTMLRewriter to inject our shield at the very beginning of the <head>.
  // This ensures it runs before any other scripts.
  const rewriter = new HTMLRewriter().on("head", {
    element(element) {
      // Prepend our shield script to the head.
      element.prepend(JAVASCRIPT_SHIELD, { asHtml: true });
    },
  });

  return rewriter.transform(originResponse);
}
