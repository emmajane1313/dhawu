import { NextResponse } from "next/server";

function generateStaticUrls(baseUrl: string, paths: string[]) {
  return paths
    .map((path) => {
      const loc = `${baseUrl}${path}`;

      const xDefault = `<xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path}" />`;

      return `
      <url>
        <loc>${loc}</loc>
          ${xDefault}
      </url>
      `;
    })
    .join("");
}

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://dhawu.emancipa.xyz";

  const staticPaths = ["/", "/marnggithinyawuy/", "/nhama/", "/dhawu-mala/"];
  const staticXml = generateStaticUrls(baseUrl, staticPaths);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
${staticXml}
</urlset>`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
