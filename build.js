/**
 * GET ECO DRIVER — Master Custom Static Site Generator (SSG)
 * Builds 100% Pure Static HTML, Schemas, Sitemaps & Cloudflare Pages Output
 * Compliant with: Koray Semantic SEO Framework & Senior Static HTML Standard
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
// HTML COMPONENTS
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

  // 2. Article Schema
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

    // 3. BreadcrumbList Schema
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
          "name": page.categoryName,
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

    // 4. FAQPage Schema
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

  return `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta property="og:locale" content="${SITE.language}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${SITE.theme.primaryColor}">
<link rel="stylesheet" href="/assets/css/style.css">
${schemaBlocks}`;
}

function renderHeader(currentPath = '/') {
  const navItems = SITE.navigation.map(n => {
    const isActive = currentPath === n.url ? ' class="active"' : '';
    return `<li><a href="${n.url}"${isActive}>${n.name}</a></li>`;
  }).join('\n        ');

  return `
<header class="site-header">
  <div class="header-inner">
    <a href="/" class="site-logo">
      <span>⚡</span> ${SITE.name}
    </a>
    <input type="checkbox" id="nav-toggle" class="nav-toggle">
    <label for="nav-toggle" class="nav-toggle-label" aria-label="Toggle Navigation">☰</label>
    <nav>
      <ul class="site-nav">
        ${navItems}
      </ul>
    </nav>
  </div>
</header>`;
}

function renderFooter() {
  const catLinks = SITE.categories.map(c => `<li><a href="/${c.slug}/">${c.name}</a></li>`).join('\n          ');

  return `
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-col">
      <h3>${SITE.name}</h3>
      <p style="color:#A0AEC0;font-size:0.9rem;line-height:1.6;margin-bottom:1rem;">
        ${SITE.description}
      </p>
      <p style="color:#718096;font-size:0.8rem;">
        Dedicated to evidence-based automotive efficiency, EV charging optimization, and green engineering.
      </p>
    </div>
    <div class="footer-col">
      <h3>Core Categories</h3>
      <ul>
        ${catLinks}
      </ul>
    </div>
    <div class="footer-col">
      <h3>Quick Links</h3>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about-us/">About Us</a></li>
        <li><a href="/contact/">Contact Us</a></li>
        <li><a href="/privacy-policy/">Privacy Policy</a></li>
        <li><a href="/terms-of-service/">Terms of Service</a></li>
        <li><a href="/sitemap.xml">XML Sitemap</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <div>&copy; ${new Date().getFullYear()} ${SITE.name}. All rights reserved.</div>
    <div>Engineered for 100/100 Core Web Vitals | Zero JavaScript Bloat</div>
  </div>
</footer>`;
}

// -------------------------------------------------------------
// PAGE GENERATORS
// -------------------------------------------------------------

const allUrls = [];

// 1. Generate Articles
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

  const cat = SITE.categories.find(c => c.slug === art.categorySlug) || { name: 'General', slug: 'general' };

  let faqHtml = '';
  if (art.faqs && art.faqs.length > 0) {
    const items = art.faqs.map(f => `
      <div class="faq-item">
        <h3 class="faq-question">${f.question}</h3>
        <p>${f.answer}</p>
      </div>
    `).join('');
    faqHtml = `
      <section class="faq-block">
        <h2 style="margin-top:0;border-bottom:none;">Frequently Asked Questions</h2>
        ${items}
      </section>
    `;
  }

  // Related sibling articles from same category
  const siblings = articles.filter(a => a.slug !== art.slug && a.categorySlug === art.categorySlug).slice(0, 4);
  let relatedHtml = '';
  if (siblings.length > 0) {
    const sibCards = siblings.map(s => `
      <a href="/${s.slug}/" class="article-card">
        <div class="article-card__title">${s.title}</div>
        <div class="article-card__desc">${s.description}</div>
      </a>
    `).join('');
    relatedHtml = `
      <section style="margin-top:3rem;">
        <h2>Related ${cat.name} Guides</h2>
        <div>${sibCards}</div>
      </section>
    `;
  }

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
<body>
${renderHeader(articleUrl)}

<main class="main-wrapper">
  <article class="article-container">
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="sep">&rsaquo;</span>
      <a href="/${cat.slug}/">${cat.name}</a>
      <span class="sep">&rsaquo;</span>
      <span>${art.title}</span>
    </nav>

    <h1>${art.title}</h1>

    <div class="article-meta">
      <span>By <span class="meta-author">${art.author || SITE.author.name}</span></span>
      <span>&bull;</span>
      <span>Published ${art.datePublishedFormatted || 'Recently'}</span>
      <span>&bull;</span>
      <span>${art.readTime || '5 min read'}</span>
    </div>

    ${art.directAnswer ? `
    <div class="direct-answer">
      <div class="direct-answer__label">⚡ Direct Answer</div>
      <p>${art.directAnswer}</p>
    </div>` : ''}

    <div class="article-body">
      ${art.bodyHtml}
    </div>

    ${faqHtml}
    ${relatedHtml}
  </article>
</main>

${renderFooter()}
</body>
</html>`;

  const pageDir = path.join(DIST, art.slug);
  ensureDir(pageDir);
  fs.writeFileSync(path.join(pageDir, 'index.html'), html);
});

// 2. Generate Category Hubs
SITE.categories.forEach(cat => {
  const catUrl = `/${cat.slug}/`;
  allUrls.push({ url: catUrl, lastmod: new Date().toISOString().split('T')[0] });

  const catArticles = articles.filter(a => a.categorySlug === cat.slug);

  const articleCards = catArticles.length > 0
    ? catArticles.map(a => `
      <a href="/${a.slug}/" class="article-card">
        <div class="article-card__title">${a.title}</div>
        <div class="article-card__desc">${a.description}</div>
      </a>
    `).join('')
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
${renderHeader(catUrl)}

<main class="main-wrapper">
  <div class="article-container">
    <nav class="breadcrumbs">
      <a href="/">Home</a>
      <span class="sep">&rsaquo;</span>
      <span>${cat.name}</span>
    </nav>

    <h1 style="display:flex;align-items:center;gap:0.75rem;">
      <span>${cat.icon}</span> ${cat.name}
    </h1>
    <p style="font-size:1.15rem;color:var(--muted);margin-bottom:2rem;">
      ${cat.description}
    </p>

    <h2 style="margin-top:2rem;">Available Engineering Guides (${catArticles.length})</h2>
    <div style="margin-top:1.5rem;">
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

// 2.5. Generate Static Institutional Pages (About, Contact, Privacy, Terms)
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
<body>
${renderHeader(pageUrl)}

<main class="main-wrapper">
  <div class="article-container">
    <nav class="breadcrumbs">
      <a href="/">Home</a>
      <span class="sep">&rsaquo;</span>
      <span>${pageData.title}</span>
    </nav>

    <h1>${pageData.title}</h1>
    
    <div class="article-body" style="margin-top:2rem;">
      ${pageData.contentHtml}
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

// 3. Generate Homepage
allUrls.unshift({ url: '/', lastmod: new Date().toISOString().split('T')[0] });

const homeCatCards = SITE.categories.map(c => {
  const count = articles.filter(a => a.categorySlug === c.slug).length;
  return `
    <a href="/${c.slug}/" class="cat-card">
      <div class="cat-card__icon">${c.icon}</div>
      <div class="cat-card__title">${c.name}</div>
      <div class="cat-card__desc">${c.description}</div>
      <div style="margin-top:auto;padding-top:1rem;font-size:0.8rem;font-weight:600;color:var(--accent);">
        Explore ${count} Guides &rarr;
      </div>
    </a>
  `;
}).join('');

const recentArticlesCards = articles.slice(0, 6).map(a => `
  <a href="/${a.slug}/" class="article-card">
    <div class="article-card__title">${a.title}</div>
    <div class="article-card__desc">${a.description}</div>
  </a>
`).join('');

const homeHtml = `<!doctype html>
<html lang="${SITE.language}">
<head>
${renderHead({
  isHome: true,
  path: '/'
})}
</head>
<body>
${renderHeader('/')}

<main class="main-wrapper">
  <section style="text-align:center;padding:3rem 1rem 2rem;max-width:800px;margin:0 auto;">
    <div style="display:inline-block;background:var(--accent-light);color:var(--primary);font-size:0.85rem;font-weight:700;padding:0.35rem 0.85rem;border-radius:20px;margin-bottom:1rem;text-transform:uppercase;letter-spacing:0.04em;">
      🌱 Evidence-Based Green Driving
    </div>
    <h1 style="font-size:2.8rem;letter-spacing:-0.03em;margin-bottom:1.25rem;">
      Drive Farther. Charge Smarter. Burn Less.
    </h1>
    <p style="font-size:1.2rem;color:var(--muted);line-height:1.6;">
      ${SITE.description}
    </p>
  </section>

  <section style="margin:3rem 0;">
    <h2 style="text-align:center;border-bottom:none;margin-bottom:2rem;">Core Efficiency Knowledge Hubs</h2>
    <div class="grid-cards">
      ${homeCatCards}
    </div>
  </section>

  ${articles.length > 0 ? `
  <section style="max-width:var(--content-w);margin:4rem auto 2rem;">
    <h2>Latest Technical Guides</h2>
    <div style="margin-top:1.5rem;">
      ${recentArticlesCards}
    </div>
  </section>` : ''}
</main>

${renderFooter()}
</body>
</html>`;

fs.writeFileSync(path.join(DIST, 'index.html'), homeHtml);

// 4. Generate Sitemaps & Robots.txt
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

// 5. Generate 404 Page
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
${renderHeader('/')}
<main class="main-wrapper" style="text-align:center;padding:6rem 1rem;">
  <div style="font-size:4rem;margin-bottom:1rem;">🔋 404</div>
  <h1>Page Not Found</h1>
  <p style="color:var(--muted);max-width:500px;margin:1rem auto 2rem;">
    The requested eco-driving guide has been moved or does not exist. Return to our homepage to explore all efficiency topics.
  </p>
  <a href="/" class="btn-amazon" style="background:var(--primary);color:#fff;display:inline-flex;">Return to Homepage</a>
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
