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
const rootFav = path.join(ROOT, 'favicon.ico');
if (fs.existsSync(rootFav)) {
  fs.copyFileSync(rootFav, path.join(DIST, 'favicon.ico'));
}

// -------------------------------------------------------------
// HTML HEAD & SCHEMAS
// -------------------------------------------------------------

function renderHead(page) {
  const title = page.titleOverride || (page.isHome ? `${SITE.name} | ${SITE.tagline}` : `${page.title} | ${SITE.name}`);
  const desc = page.description || SITE.description;
  const canonical = page.canonical || `${SITE.url}${page.path || '/'}`;
  const ogType = page.isArticle ? 'article' : 'website';
  const prevTag = page.prevUrl ? `<link rel="prev" href="${page.prevUrl}">\n` : '';
  const nextTag = page.nextUrl ? `<link rel="next" href="${page.nextUrl}">\n` : '';

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

  return `<!-- Google tag (gtag.js) & GTM container -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-4NEK6JKTV1"></script>
<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-K3S3Q7WM"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-4NEK6JKTV1');
</script>
<meta charset="utf-8">
<meta name="yandex-verification" content="1cd8264b2c81ffaf">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
${prevTag}${nextTag}<link rel="icon" type="image/x-icon" href="/favicon.ico?v=3.0">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon-32x32.png?v=3.0">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon-16x16.png?v=3.0">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/images/android-chrome-192x192.png?v=3.0">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/images/apple-touch-icon.png?v=3.0">
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
<a class="logo" href="/" aria-label="${SITE.name}"><picture><source srcset="/assets/images/logo.webp?v=3.0" type="image/webp"><img src="/assets/images/logo.png?v=3.0" alt="${SITE.name}" class="site-logo-img" width="260" height="52"></picture></a>
<nav class="nav" aria-label="Main">${navItems}</nav>
<details class="menu"><summary aria-label="Menu"><span class="bars" aria-hidden="true"></span><span class="m-open">Menu</span><span class="m-close">Close</span></summary><nav aria-label="Main menu">${navItems}</nav></details>
</div></header>`;
}

function renderFooter() {
  const catLinks = SITE.categories.map(c => `<li><a href="/${c.slug}/">${c.name}</a></li>`).join('');

  return `<footer class="site-footer"><div class="wrap">
<div class="brand"><a href="/" aria-label="${SITE.name}"><picture><source srcset="/assets/images/logo.webp?v=3.0" type="image/webp"><img src="/assets/images/logo.png?v=3.0" alt="${SITE.name}" class="site-footer-logo-img" width="220" height="44"></picture></a></div>
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
// -------------------------------------------------------------
// REAL AMAZON PRODUCTS BY CATEGORY (getecodrivers-20)
// -------------------------------------------------------------

const CATEGORY_PRODUCTS = {
  'ev-charging-and-range': [
    {
      name: "ChargePoint Home Flex Level 2 EV Charger (Up to 50A, J1772, WiFi Enabled)",
      score: "9.9",
      img: "/assets/images/products/emporia-charger.webp",
      asin: "B07WXZDHGV"
    },
    {
      name: "Level 1+2 Portable EV Charger 240V 16A 25ft Cable (NEMA 6-20 with 5-15 Adapter)",
      score: "9.8",
      img: "/assets/images/products/lectron-charger.webp",
      asin: "B0CJCYDTJX"
    },
    {
      name: "Accu-Gage RS60XA Professional Tire Pressure Gauge with Protective Rubber Guard",
      score: "9.7",
      img: "/assets/images/products/astroai-gauge.webp",
      asin: "B00VS0T7IC"
    },
    {
      name: "NOCO Boost Plus GB40 1000A 12V UltraSafe Lithium Portable Jump Starter",
      score: "9.6",
      img: "/assets/images/products/noco-booster.webp",
      asin: "B015TKUPIC"
    }
  ],
  'hybrid-powertrains': [
    {
      name: "Veepeak OBDCheck BLE Bluetooth 4.0 OBD2 Diagnostic Scanner (Dr. Prius Compatible)",
      score: "9.9",
      img: "/assets/images/products/veepeak-scanner.webp",
      asin: "B073XKQQQW"
    },
    {
      name: "Autel MaxiCOM MK808S Automotive Diagnostic Scanner (Bidirectional All-System)",
      score: "9.8",
      img: "/assets/images/products/autel-scanner.webp",
      asin: "B0744JBC7W"
    },
    {
      name: "BlueDriver Bluetooth Pro OBDII Diagnostic Scan Tool & Code Reader (iOS & Android)",
      score: "9.7",
      img: "/assets/images/products/veepeak-scanner.webp",
      asin: "B00652G4TS"
    },
    {
      name: "NOCO Boost Plus GB40 1000A 12V UltraSafe Lithium Portable Jump Starter",
      score: "9.6",
      img: "/assets/images/products/noco-booster.webp",
      asin: "B015TKUPIC"
    }
  ],
  'eco-maintenance-and-gear': [
    {
      name: "Castrol EDGE 0W-20 Advanced Full Synthetic Motor Oil (5 Quarts)",
      score: "9.9",
      img: "/assets/images/products/mobil1-oil.webp",
      asin: "B00JGQLZJ4"
    },
    {
      name: "Accu-Gage RS60XA Professional Tire Pressure Gauge (Precision Bleeder Valve)",
      score: "9.8",
      img: "/assets/images/products/astroai-gauge.webp",
      asin: "B00VS0T7IC"
    },
    {
      name: "CURT 18153 60 x 24-Inch Folding Hitch Basket Cargo Carrier (500 lbs Capacity)",
      score: "9.7",
      img: "/assets/images/products/curt-hitch-carrier.webp",
      asin: "B00JF5LRN0"
    },
    {
      name: "Thule 859XT Canyon XT Aerodynamic Rooftop Cargo Basket (Low Wind Drag)",
      score: "9.6",
      img: "/assets/images/products/thule-roof-box.webp",
      asin: "B01DWRB4TI"
    }
  ],
  'fuel-economy-and-hypermiling': [
    {
      name: "ScanGauge 3 Touch Screen OBD2 Diagnostic Computer & Real-Time MPG Fuel Economy Meter",
      score: "9.9",
      img: "/assets/images/products/scangauge-computer.webp",
      asin: "B0BFBQZZMC"
    },
    {
      name: "Veepeak OBDCheck BLE Bluetooth 4.0 OBD2 Diagnostic Scanner (Real-Time Sensors)",
      score: "9.8",
      img: "/assets/images/products/veepeak-scanner.webp",
      asin: "B073XKQQQW"
    },
    {
      name: "ANCEL AD410 Enhanced OBD2 Vehicle Code Reader & Live Data Diagnostic Tool",
      score: "9.7",
      img: "/assets/images/products/autel-scanner.webp",
      asin: "B071FSNL73"
    },
    {
      name: "Accu-Gage RS60XA Professional Tire Pressure Gauge with Protective Rubber Guard",
      score: "9.6",
      img: "/assets/images/products/astroai-gauge.webp",
      asin: "B00VS0T7IC"
    }
  ]
};

const DEFAULT_RAIL_PRODUCTS = CATEGORY_PRODUCTS['eco-maintenance-and-gear'];

function renderRail(products = DEFAULT_RAIL_PRODUCTS) {
  const items = products.map(p => `
    <li class="rail-row">
      <img src="${p.img}?v=3.0" alt="${p.name}" width="64" height="64" loading="lazy" decoding="async" referrerpolicy="no-referrer">
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

const allArticles = articleFiles.map(f => {
  const content = JSON.parse(fs.readFileSync(path.join(articlesDir, f), 'utf8'));
  return content;
});

// Scheduling Engine: Filter out future scheduled articles unless BUILD_ALL=true
const now = new Date();
const buildAll = process.env.BUILD_ALL === 'true';

const articles = allArticles.filter(art => {
  if (buildAll) return true;
  if (!art.datePublished) return true;
  return new Date(art.datePublished) <= now;
});

console.log(`
========================================`);
console.log(`🕒 SCHEDULER ENGINE: Total Articles: ${allArticles.length} | Live Published: ${articles.length} | Scheduled Future: ${allArticles.length - articles.length}`);
console.log(`========================================
`);

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
      const contentBusted = (sec.content || '').replace(/src="(\/assets\/images\/[^"?]+)(?:\?[^"]*)?"/g, 'src="$1?v=3.0"');
      sectionsHtml += `<h2 id="${slugId}">${sec.heading}</h2>\n${contentBusted}\n`;
    });
  } else if (art.bodyHtml) {
    // Parse H2s from bodyHtml and inject IDs
    const contentBusted = (art.bodyHtml || '').replace(/src="(\/assets\/images\/[^"?]+)(?:\?[^"]*)?"/g, 'src="$1?v=3.0"');
    sectionsHtml = contentBusted.replace(/<h2>(.*?)<\/h2>/gi, (match, title) => {
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
        <p class="meta">Updated on <time datetime="${art.dateModified || art.datePublished}">${formattedDate}</time> · By <a href="/about-us/">${art.author || SITE.author.name}</a> · <span>${art.readTime || '8 min read'}</span></p>
        ${art.authorCredentials ? `<p class="author-cred">${art.authorCredentials}</p>` : ''}

        <!-- NO HERO IMAGE IN INTRO (Per user exact instruction) -->

        <div class="prose">
          <!-- Direct Answer Callout Component -->
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

          <!-- Key Takeaways Box (carglassfix content pattern) -->
          ${art.keyTakeaways && art.keyTakeaways.length > 0 ? `
          <div class="takeaways-box">
            <h2>Key takeaways</h2>
            <ul>
              ${art.keyTakeaways.map(t => `<li>${t}</li>`).join('')}
            </ul>
          </div>` : ''}

          ${sectionsHtml}
          ${faqHtml}
        </div>
      </article>
    </div>

    <!-- 3. RIGHT STICKY COLUMN: Products in this guide -->
    ${renderRail(art.railProducts || CATEGORY_PRODUCTS[art.categorySlug] || DEFAULT_RAIL_PRODUCTS)}
  </div>
</main>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const batterySelect = document.getElementById('calc-battery');
  const chargerSelect = document.getElementById('calc-charger');
  const windowSelect = document.getElementById('calc-window');
  const resTime = document.getElementById('res-time');
  const resSpeed = document.getElementById('res-speed');
  const resEff = document.getElementById('res-eff');
  const resCost = document.getElementById('res-cost');

  function updateCalc() {
    if (!batterySelect || !chargerSelect || !windowSelect) return;
    const battery = parseFloat(batterySelect.value);
    const kw = parseFloat(chargerSelect.value);
    const windowFactor = parseFloat(windowSelect.value);
    const kwhNeeded = battery * windowFactor;

    // Efficiency: Level 1 (1.4 kW) is 76%, Level 2 is 89-91%
    let efficiency = kw <= 1.5 ? 0.76 : (kw < 7 ? 0.86 : 0.895);
    const totalKwhFromWall = kwhNeeded / efficiency;
    const hours = (totalKwhFromWall / kw);
    const milesPerHour = (kw * efficiency) * 3.4;
    const cost = totalKwhFromWall * 0.16;

    if (resTime) resTime.textContent = hours.toFixed(1) + ' Hours';
    if (resSpeed) resSpeed.textContent = milesPerHour.toFixed(1) + ' Miles/Hr';
    if (resEff) resEff.textContent = (efficiency * 100).toFixed(1) + '%';
    if (resCost) resCost.textContent = '$' + cost.toFixed(2);
  }

  [batterySelect, chargerSelect, windowSelect].forEach(function(el) {
    if (el) el.addEventListener('change', updateCalc);
  });
  updateCalc();
});
</script>

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

  <section style="margin:2.5rem 0;">
    <h2 class="section-title" style="margin-bottom:1.5rem;">Available Engineering Guides (${catArticles.length})</h2>
    ${articleCards}
  </section>
</main>

${renderFooter()}
</body>
</html>`;

  const catDir = path.join(DIST, cat.slug);
  ensureDir(catDir);
  fs.writeFileSync(path.join(catDir, 'index.html'), html);
});

// -------------------------------------------------------------
// PAGINATION COMPONENT & ARTICLE CARDS RENDERER
// -------------------------------------------------------------

function renderPagination(currentPage, totalPages, basePath = '') {
  if (totalPages <= 1) return '';

  const getPageUrl = (page) => {
    if (page === 1) return basePath ? `${basePath}/#guides` : '/#guides';
    return basePath ? `${basePath}/page/${page}/#guides` : `/page/${page}/#guides`;
  };

  const prevUrl = currentPage > 1 ? getPageUrl(currentPage - 1) : null;
  const nextUrl = currentPage < totalPages ? getPageUrl(currentPage + 1) : null;

  let pageNumbersHtml = '';
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      pageNumbersHtml += `<li class="pagination-item"><span class="pagination-link active" aria-current="page">${i}</span></li>`;
    } else {
      pageNumbersHtml += `<li class="pagination-item"><a href="${getPageUrl(i)}" class="pagination-link">${i}</a></li>`;
    }
  }

  const prevBtn = prevUrl
    ? `<a href="${prevUrl}" class="pagination-btn pagination-prev" aria-label="Previous page">&larr; Prev</a>`
    : `<span class="pagination-btn pagination-prev disabled" aria-disabled="true">&larr; Prev</span>`;

  const nextBtn = nextUrl
    ? `<a href="${nextUrl}" class="pagination-btn pagination-next" aria-label="Next page">Next &rarr;</a>`
    : `<span class="pagination-btn pagination-next disabled" aria-disabled="true">Next &rarr;</span>`;

  return `
  <nav class="pagination-nav" aria-label="Guides pagination">
    <div class="pagination">
      ${prevBtn}
      <ul class="pagination-list">
        ${pageNumbersHtml}
      </ul>
      ${nextBtn}
    </div>
  </nav>
  `;
}

function renderArticlesCards(items) {
  return items.map(a => {
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
}

// 4. Generate Paginated Homepage (9 Posts Per Page)
const POSTS_PER_PAGE = 9;
const totalHomePages = Math.ceil(articles.length / POSTS_PER_PAGE);

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

for (let pageNum = 1; pageNum <= totalHomePages; pageNum++) {
  const isFirstPage = pageNum === 1;
  const pageArticles = articles.slice((pageNum - 1) * POSTS_PER_PAGE, pageNum * POSTS_PER_PAGE);
  const pageCards = renderArticlesCards(pageArticles);
  const paginationHtml = renderPagination(pageNum, totalHomePages, '');

  const pagePath = isFirstPage ? '/' : `/page/${pageNum}/`;
  const canonicalUrl = isFirstPage ? `${SITE.url}/` : `${SITE.url}/page/${pageNum}/`;
  const prevUrl = pageNum > 1 ? (pageNum === 2 ? `${SITE.url}/` : `${SITE.url}/page/${pageNum - 1}/`) : null;
  const nextUrl = pageNum < totalHomePages ? `${SITE.url}/page/${pageNum + 1}/` : null;

  const titleOverride = isFirstPage ? null : `${SITE.name} | Page ${pageNum} | ${SITE.tagline}`;
  const descOverride = isFirstPage ? SITE.description : `Page ${pageNum} of practical eco-driving, EV range optimization, and fuel-saving guides from Get Eco Driver.`;
  const sectionTitle = isFirstPage ? 'Latest Efficiency & Range Guides' : `Latest Efficiency & Range Guides (Page ${pageNum} of ${totalHomePages})`;

  const homeHtml = `<!doctype html>
<html lang="${SITE.language}">
<head>
${renderHead({
  isHome: isFirstPage,
  path: pagePath,
  canonical: canonicalUrl,
  titleOverride: titleOverride,
  description: descOverride,
  prevUrl: prevUrl,
  nextUrl: nextUrl
})}
</head>
<body>

<a class="skip" href="#main">Skip to content</a>
${renderHeader(pagePath)}

<main id="main" class="wrap">
  <!-- Hero Featured Slider with 3 WebP Images -->
  <section class="hero-slider" aria-label="Featured Efficiency Highlights">
    <div class="slider-track">
      <!-- Slide 1: EV Charging & Range -->
      <div class="slide active">
        <img src="/assets/images/slide-1-ev-charging.webp?v=3.0" alt="Electric vehicle charging at modern rapid station" class="slide-img" fetchpriority="high">
        <div class="slide-overlay">
          <div class="slide-content">
            <span class="slide-badge">⚡ EV Charging & Range</span>
            <h2 class="slide-title">Why Does EV Range Drop in Winter? The Cold Penalty Solved</h2>
            <p class="slide-desc">Explore the exact electrochemistry behind cold-weather lithium-ion resistance, cabin heat pumps vs resistive heaters, and battery preconditioning.</p>
            <a href="/why-does-ev-range-drop-in-winter/" class="slide-btn">Read EV Range Guide &rarr;</a>
          </div>
        </div>
      </div>

      <!-- Slide 2: Hypermiling & Aerodynamics -->
      <div class="slide">
        <img src="/assets/images/slide-2-aerodynamic-hypermiling.webp?v=3.0" alt="Aerodynamic hybrid vehicle cruising along coastal highway" class="slide-img" loading="lazy">
        <div class="slide-overlay">
          <div class="slide-content">
            <span class="slide-badge">🌱 Hypermiling & Aerodynamics</span>
            <h2 class="slide-title">Does AC Use More Gas Than Windows Down? The 45 MPH Rule</h2>
            <p class="slide-desc">SAE wind tunnel testing proves exactly when aerodynamic drag overtakes AC compressor load. Master your highway hypermiling strategy.</p>
            <a href="/does-ac-use-more-gas-than-windows-down/" class="slide-btn">Read Aerodynamics Guide &rarr;</a>
          </div>
        </div>
      </div>

      <!-- Slide 3: Hybrid Powertrain Energy Recovery -->
      <div class="slide">
        <img src="/assets/images/slide-3-hybrid-telemetry.webp?v=3.0" alt="Driver cockpit view showing hybrid regenerative telemetry" class="slide-img" loading="lazy">
        <div class="slide-overlay">
          <div class="slide-content">
            <span class="slide-badge">🔋 Hybrid Powertrains</span>
            <h2 class="slide-title">How Does Hybrid Regenerative Braking Work? Recapturing 70% Energy</h2>
            <p class="slide-desc">Understand how permanent magnet motor-generators reverse torque into battery charge, brake-by-wire hydraulic blending, and real MPG gains.</p>
            <a href="/how-does-hybrid-regenerative-braking-work/" class="slide-btn">Read Powertrain Guide &rarr;</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <button class="slider-arrow prev" aria-label="Previous slide" onclick="moveSlide(-1)">&#10094;</button>
    <button class="slider-arrow next" aria-label="Next slide" onclick="moveSlide(1)">&#10095;</button>

    <!-- Dots -->
    <div class="slider-dots">
      <button class="dot active" onclick="setSlide(0)" aria-label="Go to Slide 1"></button>
      <button class="dot" onclick="setSlide(1)" aria-label="Go to Slide 2"></button>
      <button class="dot" onclick="setSlide(2)" aria-label="Go to Slide 3"></button>
    </div>
  </section>

  <!-- Custom Core Categories Grid -->
  <section style="margin: 2rem 0;">
    <h2 style="text-align:center;margin-bottom:1.5rem;font-family:var(--font-head);font-size:1.8rem;">Core Efficiency Knowledge Hubs</h2>
    <div class="grid-cards">
      ${homeCatCards}
    </div>
  </section>

  <!-- Latest Guides Full-Width 3-Column Grid -->
  <section id="guides" style="margin-top:3.5rem;">
    <h2 class="section-title" style="margin-bottom:1.5rem;">${sectionTitle}</h2>
    <ul class="cards">
      ${pageCards}
    </ul>
    ${paginationHtml}
  </section>
</main>

<script>
(function() {
  let current = 0;
  const slides = document.querySelectorAll('.hero-slider .slide');
  const dots = document.querySelectorAll('.hero-slider .dot');
  const total = slides.length;
  let timer = null;

  function showSlide(index) {
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === index);
      if (dots[i]) dots[i].classList.toggle('active', i === index);
    });
    current = index;
  }

  window.moveSlide = function(step) {
    let next = (current + step + total) % total;
    showSlide(next);
    resetTimer();
  };

  window.setSlide = function(index) {
    showSlide(index);
    resetTimer();
  };

  function startTimer() {
    timer = setInterval(() => {
      showSlide((current + 1) % total);
    }, 5000);
  }

  function resetTimer() {
    clearInterval(timer);
    startTimer();
  }

  const sliderEl = document.querySelector('.hero-slider');
  if (sliderEl) {
    sliderEl.addEventListener('mouseenter', () => clearInterval(timer));
    sliderEl.addEventListener('mouseleave', () => startTimer());
  }

  startTimer();
})();
</script>

${renderFooter()}
</body>
</html>`;

  if (isFirstPage) {
    allUrls.unshift({ url: '/', lastmod: new Date().toISOString().split('T')[0] });
    fs.writeFileSync(path.join(DIST, 'index.html'), homeHtml);
    const page1Dir = path.join(DIST, 'page', '1');
    ensureDir(page1Dir);
    fs.writeFileSync(path.join(page1Dir, 'index.html'), homeHtml);
  } else {
    allUrls.push({ url: `/page/${pageNum}/`, lastmod: new Date().toISOString().split('T')[0] });
    const pageDir = path.join(DIST, 'page', String(pageNum));
    ensureDir(pageDir);
    fs.writeFileSync(path.join(pageDir, 'index.html'), homeHtml);
  }
}

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
