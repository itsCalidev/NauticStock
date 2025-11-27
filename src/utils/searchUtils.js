/**
 * Normaliza un texto eliminando acentos y convirtiéndolo a minúsculas.
 * @param {string} text - El texto a normalizar.
 * @returns {string} - El texto normalizado.
 */
export const normalizeText = (text) => {
    if (!text) return '';
    return String(text)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};

/**
 * Verifica si un texto coincide con un término de búsqueda de manera flexible.
 * Divide el término de búsqueda en palabras y verifica que TODAS las palabras existan en el texto.
 * @param {string} text - El texto donde buscar.
 * @param {string} searchTerm - El término de búsqueda.
 * @returns {boolean} - True si hay coincidencia.
 */
export const flexibleMatch = (text, searchTerm) => {
    if (!searchTerm) return true;
    if (!text) return false;

    const normalizedText = normalizeText(text);
    const normalizedSearch = normalizeText(searchTerm);

    // Dividir el término de búsqueda en palabras (por espacios)
    const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length > 0);

    // Verificar que TODAS las palabras del término de búsqueda estén en el texto
    return searchWords.every(word => normalizedText.includes(word));
};
