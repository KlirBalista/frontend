/**
 * Test script to demonstrate document title deduplication functionality
 * This shows how the system will handle duplicate document names
 */

import { generateUniqueDocumentTitle, extractBaseTitle, generateUniqueFilename } from './documentTitleUtils';

// Mock axios for testing
jest.mock('@/lib/axios');
import axios from '@/lib/axios';

describe('Document Title Deduplication Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('should return original title when no conflicts exist', async () => {
    // Mock API response with no existing documents
    axios.get.mockResolvedValue({
      data: { data: [] }
    });

    const result = await generateUniqueDocumentTitle('Prenatal_Form_Carol_Smith_2025-01-25', 'birthcare123', 'patient456');
    
    expect(result).toBe('Prenatal_Form_Carol_Smith_2025-01-25');
    expect(axios.get).toHaveBeenCalledWith('/api/birthcare/birthcare123/patient-documents', {
      params: {
        patient_id: 'patient456',
        all: true
      }
    });
  });

  test('should add suffix (1) when one duplicate exists', async () => {
    // Mock API response with one existing document with the same name
    axios.get.mockResolvedValue({
      data: { 
        data: [
          { title: 'Prenatal_Form_Carol_Smith_2025-01-25' }
        ]
      }
    });

    const result = await generateUniqueDocumentTitle('Prenatal_Form_Carol_Smith_2025-01-25', 'birthcare123', 'patient456');
    
    expect(result).toBe('Prenatal_Form_Carol_Smith_2025-01-25 (1)');
  });

  test('should add suffix (2) when multiple duplicates exist', async () => {
    // Mock API response with multiple existing documents
    axios.get.mockResolvedValue({
      data: { 
        data: [
          { title: 'Prenatal_Form_Carol_Smith_2025-01-25' },
          { title: 'Prenatal_Form_Carol_Smith_2025-01-25 (1)' }
        ]
      }
    });

    const result = await generateUniqueDocumentTitle('Prenatal_Form_Carol_Smith_2025-01-25', 'birthcare123', 'patient456');
    
    expect(result).toBe('Prenatal_Form_Carol_Smith_2025-01-25 (2)');
  });

  test('should handle many duplicates correctly', async () => {
    // Mock API response with many existing documents
    axios.get.mockResolvedValue({
      data: { 
        data: [
          { title: 'Patient_Chart_Carol_Smith_2025-01-25' },
          { title: 'Patient_Chart_Carol_Smith_2025-01-25 (1)' },
          { title: 'Patient_Chart_Carol_Smith_2025-01-25 (2)' },
          { title: 'Patient_Chart_Carol_Smith_2025-01-25 (3)' },
          { title: 'Patient_Chart_Carol_Smith_2025-01-25 (4)' }
        ]
      }
    });

    const result = await generateUniqueDocumentTitle('Patient_Chart_Carol_Smith_2025-01-25', 'birthcare123', 'patient456');
    
    expect(result).toBe('Patient_Chart_Carol_Smith_2025-01-25 (5)');
  });

  test('should extract base title correctly', () => {
    expect(extractBaseTitle('Document_Name')).toBe('Document_Name');
    expect(extractBaseTitle('Document_Name (1)')).toBe('Document_Name');
    expect(extractBaseTitle('Document_Name (25)')).toBe('Document_Name');
    expect(extractBaseTitle('Complex_Document_Name_With_Underscores (10)')).toBe('Complex_Document_Name_With_Underscores');
  });

  test('should generate safe filenames', () => {
    expect(generateUniqueFilename('Simple_Document')).toBe('Simple_Document.pdf');
    expect(generateUniqueFilename('Document (1)')).toBe('Document_(1).pdf');
    expect(generateUniqueFilename('Document with spaces')).toBe('Document_with_spaces.pdf');
    expect(generateUniqueFilename('Document/with\\special*chars', 'docx')).toBe('Document_with_special_chars.docx');
  });

  test('should handle API errors gracefully with timestamp fallback', async () => {
    // Mock API error
    axios.get.mockRejectedValue(new Error('Network error'));
    
    const originalTime = Date.now;
    Date.now = jest.fn(() => 1640995200000); // Mock timestamp

    const result = await generateUniqueDocumentTitle('Test_Document', 'birthcare123', 'patient456');
    
    expect(result).toBe('Test_Document (1640995200000)');
    
    Date.now = originalTime; // Restore original Date.now
  });
});

// Integration test scenario
describe('Integration Test Scenario', () => {
  test('Carol creates multiple prenatal forms - realistic scenario', async () => {
    // Simulate multiple document creation attempts for the same patient on the same day
    const baseTitle = 'Prenatal_Form_Carol_Smith_2025-01-25';
    const birthcareId = 'birthcare_123';
    const patientId = 'patient_carol_456';

    // First document creation - no conflicts
    axios.get.mockResolvedValueOnce({
      data: { data: [] }
    });
    const title1 = await generateUniqueDocumentTitle(baseTitle, birthcareId, patientId);
    expect(title1).toBe('Prenatal_Form_Carol_Smith_2025-01-25');

    // Second document creation - one conflict
    axios.get.mockResolvedValueOnce({
      data: { 
        data: [
          { title: 'Prenatal_Form_Carol_Smith_2025-01-25' }
        ]
      }
    });
    const title2 = await generateUniqueDocumentTitle(baseTitle, birthcareId, patientId);
    expect(title2).toBe('Prenatal_Form_Carol_Smith_2025-01-25 (1)');

    // Third document creation - two conflicts
    axios.get.mockResolvedValueOnce({
      data: { 
        data: [
          { title: 'Prenatal_Form_Carol_Smith_2025-01-25' },
          { title: 'Prenatal_Form_Carol_Smith_2025-01-25 (1)' }
        ]
      }
    });
    const title3 = await generateUniqueDocumentTitle(baseTitle, birthcareId, patientId);
    expect(title3).toBe('Prenatal_Form_Carol_Smith_2025-01-25 (2)');

    console.log('Document creation sequence:');
    console.log('1st document:', title1);
    console.log('2nd document:', title2);  
    console.log('3rd document:', title3);
  });
});