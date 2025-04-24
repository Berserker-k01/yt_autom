/**
 * Utilitaires de performance pour optimiser le chargement et le rendu
 */

// Cache pour mémoriser les résultats des fonctions coûteuses
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Technique de debounce pour limiter l'exécution des fonctions
export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

// Accélération du chargement des images
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Préchargement des ressources clés
export const preloadResources = async (resources) => {
  const promises = resources.map(resource => {
    if (resource.endsWith('.jpg') || resource.endsWith('.png') || resource.endsWith('.svg')) {
      return preloadImage(resource);
    }
    return fetch(resource).then(res => res.text());
  });
  
  try {
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Erreur de préchargement:', error);
    return false;
  }
};

// Optimisation des listes longues avec technique de fenêtrage
export const createWindowedList = (items, windowSize = 20) => {
  return {
    getItems: (startIndex, endIndex) => {
      return items.slice(startIndex, Math.min(endIndex, items.length));
    },
    totalSize: items.length,
  };
};

// Mesure de performance des composants
export const measureRenderTime = (Component) => {
  return function MeasuredComponent(props) {
    const startTime = performance.now();
    const result = Component(props);
    const endTime = performance.now();
    console.debug(`Rendu de ${Component.name}: ${endTime - startTime}ms`);
    return result;
  };
};
