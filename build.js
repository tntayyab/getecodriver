/**
 * GET ECO DRIVER — Master Custom Static Site Generator (SSG)
 * Architecture: 100% Strict Replication of seniorlearningnetwork.com Inner Page Engine
 * Compliant with: Koray Semantic SEO Framework & Campfire (AFF 200) Editorial Standard
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.json'), 'utf8'));

// Helper: Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Clean and recreate dist
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
}
ensureDir(DIST);

// Copy assets
function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
const assetsSrc = path.join(ROOT, 'assets');
if (fs.existsSync(assetsSrc)) {
  copyDir(assetsSrc, path.join(DIST, 'assets'));
}

// -------------------------------------------------------------
// HTML HEAD & SCHEMAS
// -------------------------------------------------------------

function renderHead(page) {
  const title = page.isHome ? `${SITE.name} | ${SITE.tagline}` : `${page.title} | ${SITE.name}`;
  const desc = page.description || SITE.description;
  const canonical = page.canonical || `${SITE.url}${page.path || '/'}`;
  const ogType = page.isArticle ? 'article' : 'website';

  let schemaBlocks = '';

  // 1. WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE.name,
    "url": SITE.url,
    "description": SITE.description
  };
  schemaBlocks += `<script type="application/ld+json">${JSON.stringify(websiteSchema)}</script>\n`;

  // 2. Article & FAQ Schemas
  if (page.isArticle) {
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": page.title,
      "description": desc,
      "mainEntityOfPage": canonical,
      "datePublished": page.datePublished || "2026-11-04T00:00:00+00:00",
      "dateModified": page.dateModified || page.datePublished || "2026-11-04T00:00:00+00:00",
      "author": {
        "@type": "Person",
        "name": page.author || SITE.author.name
      },
      "publisher": {
        "@type": "Organization",
        "name": SITE.name,
        "url": SITE.url
      }
    };
    schemaBlocks += `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>\n`;

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": SITE.url
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": page.categoryName || "Guides",
          "item": `${SITE.url}/${page.categorySlug}/`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": page.title,
          "item": canonical
        }
      ]
    };
    schemaBlocks += `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>\n`;

    if (page.faqs && page.faqs.length > 0) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": page.faqs.map(f => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answer
          }
        }))
      };
      schemaBlocks += `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>\n`;
    }
  }

  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta property="og:locale" content="${SITE.language}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1F4D3A">
<link rel="stylesheet" href="/assets/css/style.css">
${schemaBlocks}`;
}

// -------------------------------------------------------------
// SENIOR LEARNING NETWORK HEADER & FOOTER
// -------------------------------------------------------------

function renderHeader(currentPath = '/') {
  const navItems = SITE.navigation.map(n => {
    const isCurrent = currentPath === n.url ? ' aria-current="page"' : '';
    return `<a href="${n.url}"${isCurrent}>${n.name}</a>`;
  }).join('');

  return `<header class="site-header"><div class="wrap">
<a class="logo" href="/"><svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path class="frame" d="M12 6h8M16 3v3M10 9h12l-1.5 3h-9z"/><rect class="frame" x="10" y="12" width="12" height="13" rx="3"/><ellipse class="glow" cx="16" cy="18.5" rx="3" ry="4"/><path class="frame" d="M9 28h14"/></svg>${SITE.name}</a>
<nav class="nav" aria-label="Main">${navItems}</nav>
<details class="menu"><summary aria-label="Menu"><span class="bars" aria-hidden="true"></span><span class="m-open">Menu</span><span class="m-close">Close</span></summary><nav aria-label="Main menu">${navItems}</nav></details>
</div></header>`;
}

function renderFooter() {
  const catLinks = SITE.categories.map(c => `<li><a href="/${c.slug}/">${c.name}</a></li>`).join('');

  return `<footer class="site-footer"><div class="wrap">
<div class="brand">${SITE.name}</div>
<p>${SITE.description}</p>
<ul class="links cats" aria-label="Guides">${catLinks}</ul>
<ul class="links">
  <li><a href="/about-us/">About Us</a></li>
  <li><a href="/contact/">Contact Us</a></li>
  <li><a href="/privacy-policy/">Privacy Policy</a></li>
  <li><a href="/terms-of-service/">Terms of Service</a></li>
  <li><a href="/sitemap.xml">XML Sitemap</a></li>
</ul>
<p class="disclaimer">${SITE.name} is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. Additionally, we may participate in other affiliate programs and may be compensated for referring traffic and business to these companies at no cost to you.</p>
<p>&copy; ${new Date().getFullYear()} ${SITE.name}. All rights reserved.</p>
</div></footer>`;
}

// -------------------------------------------------------------
// DEFAULT RAIL PRODUCTS (Automotive Efficiency Gear)
// -------------------------------------------------------------

const DEFAULT_RAIL_PRODUCTS = [
  {
    name: "Veepeak OBDCheck BLE OBD2 Diagnostic Scanner",
    score: "9.8",
    img: "https://m.media-amazon.com/images/I/61t-X39nOaL._AC_SL500_.jpg",
    asin: "B073NKRQPP"
  },
  {
    name: "AstroAI Digital Tire Pressure Gauge 150 PSI",
    score: "9.7",
    img: "https://m.media-amazon.com/images/I/71R2c39JtYL._AC_SL500_.jpg",
    asin: "B01J888JF0"
  },
  {
    name: "Lectron Level 2 Electric Vehicle (EV) Charger 32A",
    score: "9.6",
    img: "https://m.media-amazon.com/images/I/61b7Uj5J5fL._AC_SL500_.jpg",
    asin: "B07B8X851P"
  },
  {
    name: "NOCO Boost Plus GB40 1000A Jump Starter",
    score: "9.5",
    img: "https://m.media-amazon.com/images/I/71G8lQ1oWCL._AC_SL500_.jpg",
    asin: "B015TKUPIC"
  }
];

function renderRail(products = DEFAULT_RAIL_PRODUCTS) {
  const items = products.map(p => `
    <li class="rail-row">
      <img src="${p.img}" alt="${p.name}" width="64" height="64" loading="lazy" decoding="async">
      <div class="rail-body">
        <a class="rail-name" href="https://www.amazon.com/dp/${p.asin}?tag=${SITE.affiliate.amazonTag}" rel="nofollow" target="_blank">${p.name}</a>
        <span class="rail-meta">
          <span class="rail-score"><b>${p.score}</b>/10 our score</span>
          <a class="rail-go" href="https://www.amazon.com/dp/${p.asin}?tag=${SITE.affiliate.amazonTag}" rel="nofollow" target="_blank">Check it</a>
        </span>
      </div>
    </li>
  `).join('');

  return `<aside class="rail-col" aria-label="Products on this page">
  <div class="rail">
    <p class="rail-title">Products in this guide</p>
    <ol class="rail-list">
      ${items}
    </ol>
  </div>
</aside>`;
}

// -------------------------------------------------------------
// PAGE GENERATORS
// -------------------------------------------------------------

const allUrls = [];

// 1. Generate Articles (Exact 1:1 Senior Learning Network layout)
const articlesDir = path.join(ROOT, 'src', 'content', 'articles');
ensureDir(articlesDir);
const articleFiles = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));

const articles = articleFiles.map(f => {
  const content = JSON.parse(fs.readFileSync(path.join(articlesDir, f), 'utf8'));
  return content;
});

// Sort newest first
articles.sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished));

articles.forEach(art => {
  const articleUrl = `/${art.slug}/`;
  allUrls.push({ url: articleUrl, lastmod: art.dateModified || art.datePublished });

  const cat = SITE.categories.find(c => c.slug === art.categorySlug) || { name: 'Guides', slug: 'guides' };

  // Helper to extract or assemble sections and TOC
  let sectionsHtml = '';
  let tocItems = '';
  const headings = [];

  if (art.sections && Array.isArray(art.sections)) {
    art.sections.forEach((sec, idx) => {
      const slugId = sec.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      headings.push({ id: slugId, title: sec.heading });
      sectionsHtml += `<h2 id="${slugId}">${sec.heading}</h2>\n${sec.content}\n`;
    });
  } else if (art.bodyHtml) {
    // Parse H2s from bodyHtml and inject IDs
    sectionsHtml = art.bodyHtml.replace(/<h2>(.*?)<\/h2>/gi, (match, title) => {
      const slugId = title.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      headings.push({ id: slugId, title: title.replace(/<[^>]+>/g, '') });
      return `<h2 id="${slugId}">${title}</h2>`;
    });
  }

  // FAQs as H2 or section
  let faqHtml = '';
  if (art.faqs && art.faqs.length > 0) {
    const faqId = "frequently-asked-questions";
    headings.push({ id: faqId, title: "Frequently Asked Questions" });
    const faqItems = art.faqs.map(f => `
      <div style="margin:1.5rem 0;padding:1.2rem;background:var(--bg);border-radius:var(--radius);border:1px solid var(--line);">
        <h3 style="margin-top:0;font-size:1.15rem;color:var(--primary);">${f.question}</h3>
        <p style="margin:0.5rem 0 0;font-size:1.05rem;line-height:1.6;">${f.answer}</p>
      </div>
    `).join('');
    faqHtml = `<h2 id="${faqId}">Frequently Asked Questions</h2>\n${faqItems}`;
  }

  tocItems = headings.map(h => `<li><a href="#${h.id}">${h.title}</a></li>`).join('');

  const formattedDate = new Date(art.dateModified || art.datePublished).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const html = `<!doctype html>
<html lang="${SITE.language}">
<head>
${renderHead({
  title: art.title,
  description: art.description,
  path: articleUrl,
  isArticle: true,
  categoryName: cat.name,
  categorySlug: cat.slug,
  datePublished: art.datePublished,
  dateModified: art.dateModified,
  faqs: art.faqs
})}
</head>
<body class="is-post">
<a class="skip" href="#main">Skip to content</a>
${renderHeader(articleUrl)}

<main id="main" class="wrap">
  <nav class="crumbs sr-only" aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/${cat.slug}/">${cat.name}</a></li>
      <li aria-current="page">${art.title}</li>
    </ol>
  </nav>

  <div class="layout has-toc">
    <!-- 1. LEFT STICKY COLUMN: Table of Contents & Amazon Earning Box -->
    <aside class="toc-col">
      <div class="toc-stick">
        <nav class="toc-side" aria-label="On this page">
          <p class="toc-title">On this page</p>
          <ol>
            ${tocItems}
          </ol>
        </nav>
        <aside class="toc-earn" aria-label="Earning information">
          <p class="toc-earn-title">Earning information</p>
          <p>As an Amazon Associate, we earn from qualifying purchases, at no extra cost to you.</p>
        </aside>
      </div>
    </aside>

    <!-- 2. CENTER MAIN COLUMN: Article Header & Prose -->
    <div>
      <article class="article">
        <span class="kicker">${cat.name}</span>
        <h1>${art.title}</h1>
        <p class="meta">Updated on <time datetime="${art.dateModified || art.datePublished}">${formattedDate}</time> · By the <a href="/about-us/">${art.author || SITE.author.name}</a></p>

        <div class="prose">
          <!-- Exact Senior Learning Network Direct Answer Component -->
          ${art.directAnswer ? `
          <div class="answer">
            <div class="answer-label">
              <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path class="frame" d="M12 6h8M16 3v3M10 9h12l-1.5 3h-9z"/><rect class="frame" x="10" y="12" width="12" height="13" rx="3"/><ellipse class="glow" cx="16" cy="18.5" rx="3" ry="4"/><path class="frame" d="M9 28h14"/></svg>
              Direct Answer
            </div>
            <p class="answer-text">${art.directAnswer}</p>
          </div>` : ''}

          <!-- Mobile Inline Accordion TOC -->
          <details class="toc toc-inline">
            <summary>On this page <span class="count">(${headings.length} sections)</span></summary>
            <ol>
              ${tocItems}
            </ol>
          </details>

          ${sectionsHtml}
          ${faqHtml}
        </div>
      </article>
    </div>

    <!-- 3. RIGHT STICKY COLUMN: Products in this guide -->
    ${renderRail(art.railProducts || DEFAULT_RAIL_PRODUCTS)}
  </div>
</main>

${renderFooter()}
</body>
</html>`;

  const pageDir = path.join(DIST, art.slug);
  ensureDir(pageDir);
  fs.writeFileSync(path.join(pageDir, 'index.html'), html);
});

// 2. Generate Institutional Pages (About, Contact, Privacy, Terms)
const pagesDir = path.join(ROOT, 'src', 'content', 'pages');
if (fs.existsSync(pagesDir)) {
  const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.json'));
  pageFiles.forEach(f => {
    const pageData = JSON.parse(fs.readFileSync(path.join(pagesDir, f), 'utf8'));
    const pageUrl = `/${pageData.slug}/`;
    allUrls.push({ url: pageUrl, lastmod: new Date().toISOString().split('T')[0] });

    const html = `<!doctype html>
<html lang="${SITE.language}">
<head>
${renderHead({
  title: pageData.title,
  description: pageData.description,
  path: pageUrl
})}
</head>
<body class="is-post">
<a class="skip" href="#main">Skip to content</a>
${renderHeader(pageUrl)}

<main id="main" class="wrap">
  <div class="layout">
    <div>
      <article class="article">
        <span class="kicker">Institutional</span>
        <h1>${pageData.title}</h1>
        <div class="prose" style="margin-top:2rem;">
          ${pageData.contentHtml}
        </div>
      </article>
    </div>
  </div>
</main>

${renderFooter()}
</body>
</html>`;

    const targetDir = path.join(DIST, pageData.slug);
    ensureDir(targetDir);
    fs.writeFileSync(path.join(targetDir, 'index.html'), html);
  });
}

// 3. Generate Category Hubs
SITE.categories.forEach(cat => {
  const catUrl = `/${cat.slug}/`;
  allUrls.push({ url: catUrl, lastmod: new Date().toISOString().split('T')[0] });

  const catArticles = articles.filter(a => a.categorySlug === cat.slug);

  const articleCards = catArticles.length > 0
    ? `<ul class="cards">
        ${catArticles.map(a => `
          <li>
            <article class="card">
              <div class="card-body">
                <span class="tag">${cat.name}</span>
                <h3><a href="/${a.slug}/">${a.title}</a></h3>
                <p>${a.description}</p>
                <time datetime="${a.datePublished}">${new Date(a.datePublished).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
              </div>
            </article>
          </li>
        `).join('')}
       </ul>`
    : '<p style="color:var(--muted);padding:2rem 0;">Comprehensive technical guides for this cluster are currently being published. Check back shortly.</p>';

  const html = `<!doctype html>
<html lang="${SITE.language}">
<head>
${renderHead({
  title: `${cat.name} Guides & Optimization`,
  description: cat.description,
  path: catUrl
})}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${renderHeader(catUrl)}

<main id="main" class="wrap">
  <section class="hero">
    <span class="kicker">${SITE.name} Category Hub</span>
    <h1>${cat.name}</h1>
    <p class="lead">${cat.description}</p>
  </section>

  <div class="layout">
    <div>
      <h2 class="section-title">Available Engineering Guides (${catArticles.length})</h2>
      ${articleCards}
    </div>
  </div>
</main>

${renderFooter()}
</body>
</html>`;

  const catDir = path.join(DIST, cat.slug);
  ensureDir(catDir);
  fs.writeFileSync(path.join(catDir, 'index.html'), html);
});

// 4. Generate Custom Homepage
allUrls.unshift({ url: '/', lastmod: new Date().toISOString().split('T')[0] });

const homeCatCards = SITE.categories.map(c => {
  const count = articles.filter(a => a.categorySlug === c.slug).length;
  return `
    <a href="/${c.slug}/" class="cat-card">
      <div class="cat-card__icon">${c.icon}</div>
      <div class="cat-card__title">${c.name}</div>
      <div class="cat-card__desc">${c.description}</div>
      <div style="margin-top:auto;padding-top:1rem;font-size:0.85rem;font-weight:700;color:var(--primary);">
        Explore ${count} Guides &rarr;
      </div>
    </a>
  `;
}).join('');

const recentArticlesCards = articles.map(a => {
  const cat = SITE.categories.find(c => c.slug === a.categorySlug) || { name: 'Guides' };
  return `
    <li>
      <article class="card">
        <div class="card-body">
          <span class="tag">${cat.name}</span>
          <h3><a href="/${a.slug}/">${a.title}</a></h3>
          <p>${a.description}</p>
          <time datetime="${a.datePublished}">Updated ${new Date(a.dateModified || a.datePublished).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
        </div>
      </article>
    </li>
  `;
}).join('');

const homeHtml = `<!doctype html>
<html lang="${SITE.language}">
<head>
${renderHead({
  isHome: true,
  path: '/'
})}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${renderHeader('/')}

<main id="main" class="wrap">
  <!-- Custom Hero Section -->
  <section class="custom-hero">
    <div class="custom-badge">🌱 Evidence-Based Green Driving</div>
    <h1>Drive Farther. Charge Smarter. Burn Less.</h1>
    <p>${SITE.description}</p>
  </section>

  <!-- Custom Core Categories Grid -->
  <section style="margin: 2rem 0;">
    <h2 style="text-align:center;margin-bottom:1.5rem;font-family:var(--font-head);font-size:1.8rem;">Core Efficiency Knowledge Hubs</h2>
    <div class="grid-cards">
      ${homeCatCards}
    </div>
  </section>

  <!-- Latest Guides using Senior Cards Layout -->
  <div class="layout" style="margin-top:3rem;">
    <div>
      <h2 class="section-title">Latest Efficiency & Range Guides</h2>
      <ul class="cards">
        ${recentArticlesCards}
      </ul>
    </div>
  </div>
</main>

${renderFooter()}
</body>
</html>`;

fs.writeFileSync(path.join(DIST, 'index.html'), homeHtml);

// 5. Generate Sitemaps & Robots.txt
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url><loc>${SITE.url}${u.url}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapXml);

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`;
fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsTxt);

// 6. Generate 404 Page
const notFoundHtml = `<!doctype html>
<html lang="${SITE.language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page Not Found | ${SITE.name}</title>
<meta name="robots" content="noindex, follow">
<link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${renderHeader('/')}
<main id="main" class="wrap" style="text-align:center;padding:5rem 1rem;">
  <div style="font-size:4rem;margin-bottom:1rem;">🔋 404</div>
  <h1>Page Not Found</h1>
  <p style="color:var(--muted);max-width:500px;margin:1rem auto 2rem;font-size:1.1rem;line-height:1.6;">
    The requested eco-driving guide has been moved or does not exist. Return to our homepage to explore all efficiency topics.
  </p>
  <a href="/" class="btn" style="display:inline-flex;">Return to Homepage</a>
</main>
${renderFooter()}
</body>
</html>`;

fs.writeFileSync(path.join(DIST, '404.html'), notFoundHtml);

console.log(`\n========================================`);
console.log(`✅ BUILD COMPLETE: getecodriver.com`);
console.log(`Total URLs Generated: ${allUrls.length}`);
console.log(`Output Directory: ${DIST}`);
console.log(`========================================\n`);
