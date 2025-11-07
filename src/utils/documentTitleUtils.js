/**
 * Utility functions for handling document title deduplication
 */
import axios from '@/lib/axios';

/**
 * Generate a unique document title by checking for existing titles
 * and adding numeric suffixes if duplicates exist
 * 
 * @param {string} baseTitle - The original title without suffix
 * @param {string} birthcareId - The birthcare facility ID
 * @param {string} patientId - The patient ID (optional for additional filtering)
 * @returns {Promise<string>} - The unique title with suffix if needed
 */
export const generateUniqueDocumentTitle = async (baseTitle, birthcareId, patientId = null) => {
  try {
    // Get all existing documents to check for title conflicts
    const response = await axios.get(`/api/birthcare/${birthcareId}/patient-documents`, {
      params: {
        patient_id: patientId, // Optional filter by patient
        all: true // Get all documents, not paginated
      }
    });

    const existingDocuments = response.data.data || [];
    const existingTitles = existingDocuments.map(doc => doc.title);

    // If no conflict, return original title
    if (!existingTitles.includes(baseTitle)) {
      return baseTitle;
    }

    // Find the next available suffix number
    let suffix = 1;
    let uniqueTitle = `${baseTitle} (${suffix})`;

    while (existingTitles.includes(uniqueTitle)) {
      suffix++;
      uniqueTitle = `${baseTitle} (${suffix})`;
    }

    return uniqueTitle;
  } catch (error) {
    console.error('Error generating unique document title:', error);
    // If there's an error checking existing titles, add a timestamp suffix as fallback
    const timestamp = new Date().getTime();
    return `${baseTitle} (${timestamp})`;
  }
};

/**
 * Extract base title from a title that may already have a suffix
 * This helps when regenerating documents to avoid nested suffixes
 * 
 * @param {string} title - Title that may contain suffix like "Document (1)"
 * @returns {string} - Base title without suffix
 */
export const extractBaseTitle = (title) => {
  // Remove suffix pattern like " (1)", " (2)", etc.
  const suffixPattern = /\s+\(\d+\)$/;
  return title.replace(suffixPattern, '');
};

/**
 * Generate unique filename based on title with proper extension
 * 
 * @param {string} uniqueTitle - The unique title (already deduplicated)
 * @param {string} extension - File extension (default: 'pdf')
 * @returns {string} - Filename with proper extension
 */
export const generateUniqueFilename = (uniqueTitle, extension = 'pdf') => {
  // Replace spaces and special characters with underscores for filename safety
  const safeFilename = uniqueTitle
    .replace(/[^a-zA-Z0-9\s\(\)]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  
  return `${safeFilename}.${extension}`;
};