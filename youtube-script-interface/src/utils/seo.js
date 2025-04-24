/**
 * Utilitaires SEO et méta-données pour améliorer le référencement
 * et la présentation de l'application d'automatisation YouTube
 */

import { Helmet } from 'react-helmet';
import React from 'react';

// Configuration globale SEO
const defaultMetaTags = {
  title: "YT Autom - Automatisation de scripts YouTube avec IA",
  description: "Générateur de contenu pour YouTube utilisant Gemini API et SerpAPI pour créer des sujets, analyser leur potentiel et générer des scripts complets avec sources.",
  keywords: "YouTube, automatisation, génération de contenu, Gemini API, SerpAPI, script, vidéo, IA",
  author: "YT Autom",
  ogImage: "/og-image.jpg", // Assurez-vous que cette image existe dans le dossier public
  twitterHandle: "@ytautom",
  canonicalUrl: "https://yt-autom-frontend.onrender.com"
};

// Composant pour injecter les balises SEO
export const SEOHelmet = ({ title, description, keywords, ogImage, canonicalUrl, structuredData }) => {
  const metaTitle = title ? `${title} | YT Autom` : defaultMetaTags.title;
  const metaDescription = description || defaultMetaTags.description;
  const metaKeywords = keywords || defaultMetaTags.keywords;
  const metaOgImage = ogImage || defaultMetaTags.ogImage;
  const metaCanonicalUrl = canonicalUrl || defaultMetaTags.canonicalUrl;

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={defaultMetaTags.author} />
      
      {/* Open Graph */}
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaOgImage} />
      <meta property="og:url" content={metaCanonicalUrl} />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={defaultMetaTags.twitterHandle} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaOgImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={metaCanonicalUrl} />
      
      {/* Données structurées pour les moteurs de recherche */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

// Données structurées pour améliorer la visibilité dans Google
export const generateStructuredData = (pageType, data) => {
  switch (pageType) {
    case 'home':
      return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "YT Autom - Générateur de scripts YouTube",
        "applicationCategory": "ProductivityApplication",
        "description": "Outil d'automatisation pour créer des scripts YouTube optimisés à l'aide de l'IA",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "EUR"
        }
      };
    case 'script':
      return {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": data.title || "Script YouTube",
        "author": data.author || "YT Autom",
        "dateCreated": new Date().toISOString(),
        "text": data.preview || "Script généré automatiquement pour YouTube",
        "keywords": data.keywords || "YouTube, vidéo, script"
      };
    default:
      return null;
  }
};

export default {
  SEOHelmet,
  generateStructuredData
};
