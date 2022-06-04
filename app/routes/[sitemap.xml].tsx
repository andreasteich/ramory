export async function loader() {
    const staticUrls: string[] = [
        ''
    ]

    const urlTag = url => (
        `<url>
            <loc>https://ramory.rocks/${url}</loc>
            <lastmod>${new Date()}</lastmod>
            <priority>1.0</priority>
        </url>`
    )

    const content = `
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${ staticUrls.map(urlTag) }
        </urlset>
    `
    
    return new Response(content,{
        status: 200,
        headers: {
            "Content-Type": "application/xml",
            "xml-version": "1.0",
            "encoding": "UTF-8"
        }
    });
};
  