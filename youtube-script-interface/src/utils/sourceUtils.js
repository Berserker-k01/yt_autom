/**
 * Utilitaires pour la gestion des sources
 * Optimisé pour la fonctionnalité d'extraction et d'affichage des sources
 * dans la génération de contenu YouTube avec SerpAPI
 */

// Normalisation des sources pour l'affichage et l'indexation
export const normalizeSource = (source) => {
  if (!source) return null;
  
  // Si c'est déjà un objet avec les champs requis, le retourner tel quel
  if (source.title && source.url) {
    return {
      title: source.title,
      url: source.url,
      author: source.author || 'Non spécifié',
      date: source.date || 'Non spécifiée',
      snippet: source.snippet || ''
    };
  }
  
  // Si c'est une chaîne, essayer de l'analyser
  if (typeof source === 'string') {
    try {
      // Voir si c'est une URL
      if (source.startsWith('http')) {
        let domain = '';
        try {
          domain = new URL(source).hostname;
        } catch (e) {
          domain = source.split('/')[2] || 'Source web';
        }
        
        return {
          title: domain,
          url: source,
          author: 'Non spécifié',
          date: 'Non spécifiée',
          snippet: ''
        };
      }
      
      // Sinon, traiter comme un titre
      return {
        title: source,
        url: '',
        author: 'Non spécifié',
        date: 'Non spécifiée',
        snippet: ''
      };
    } catch (error) {
      console.error('Erreur lors de la normalisation de la source:', error);
      return null;
    }
  }
  
  return null;
};

// Génération d'un identifiant unique pour les sources
export const generateSourceId = (source) => {
  const normalizedSource = normalizeSource(source);
  if (!normalizedSource) return '';
  
  // Utiliser l'URL comme base pour l'identifiant
  if (normalizedSource.url) {
    // Nettoyer l'URL pour créer un identifiant
    return normalizedSource.url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 32);
  }
  
  // Sinon, utiliser le titre
  return normalizedSource.title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 32);
};

// Formater les sources pour l'affichage dans le PDF
export const formatSourceForPdf = (source, index) => {
  const normalizedSource = normalizeSource(source);
  if (!normalizedSource) return '';
  
  // Format de citation en fonction des informations disponibles
  let citation = `[${index + 1}] `;
  
  if (normalizedSource.title) {
    citation += `${normalizedSource.title}. `;
  }
  
  if (normalizedSource.author && normalizedSource.author !== 'Non spécifié') {
    citation += `${normalizedSource.author}. `;
  }
  
  if (normalizedSource.date && normalizedSource.date !== 'Non spécifiée') {
    citation += `${normalizedSource.date}. `;
  }
  
  if (normalizedSource.url) {
    citation += `Disponible sur: ${normalizedSource.url}`;
  }
  
  return citation;
};

// Créer un système d'index de références pour le script
export const createReferenceIndex = (script, sources) => {
  if (!script || !sources || sources.length === 0) {
    return { indexedScript: script, referenceMap: {} };
  }

  const referenceMap = {};
  let indexedScript = script;
  
  // Marquer chaque source dans le script avec son index [1], [2], etc.
  sources.forEach((source, index) => {
    const normalizedSource = normalizeSource(source);
    if (!normalizedSource) return;
    
    const sourceId = generateSourceId(normalizedSource);
    referenceMap[index + 1] = normalizedSource;
    
    // Pour l'analyse de contenu, utiliser le titre ou le domaine
    const searchTerms = [
      normalizedSource.title,
      normalizedSource.url ? (new URL(normalizedSource.url).hostname) : ''
    ].filter(Boolean);
    
    // Chercher chaque terme dans le script et ajouter une référence
    searchTerms.forEach(term => {
      if (!term || term.length < 5) return; // Ignorer les termes trop courts
      
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      
      // Ajouter la référence seulement à la première occurrence
      let matched = false;
      indexedScript = indexedScript.replace(regex, (match) => {
        if (matched) return match;
        matched = true;
        return `${match} [${index + 1}]`;
      });
    });
  });
  
  return { indexedScript, referenceMap };
};

export default {
  normalizeSource,
  generateSourceId,
  formatSourceForPdf,
  createReferenceIndex
};
