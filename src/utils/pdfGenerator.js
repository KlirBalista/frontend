import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateUniqueDocumentTitle } from './documentTitleUtils';
export const generatePrenatalFormPDF = (formData, patientData, birthCareInfo = null) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  // Helper function to format date without time
  const formatDateOnly = (dateString) => {
    if (!dateString) return null;
    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      // Parse and extract only the date part
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toISOString().split('T')[0];
    } catch (e) {
      return dateString;
    }
  };
  
  // Simple helper function to draw fields - matching Birth Details style
  const drawSimpleField = (x, y, width, label, value, bold = false) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`${label}:`, x, y);
    
    if (value && value !== 'N/A' && value !== '') {
      const valueText = String(value);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      // Simple underline for value
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.line(x + labelWidth, y + 1, x + width, y + 1);
      doc.text(valueText, x + labelWidth + 2, y - 1);
    } else {
      // Draw empty line
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.line(x + labelWidth, y + 1, x + width, y + 1);
    }
  };
  
  const drawSimpleTwoColumns = (yPos, leftLabel, leftValue, rightLabel, rightValue) => {
    const colWidth = 80;
    drawSimpleField(margin, yPos, colWidth, leftLabel, leftValue);
    drawSimpleField(margin + 90, yPos, colWidth, rightLabel, rightValue);
    return yPos + 8;
  };
  
  const drawSimpleFullWidth = (yPos, label, value) => {
    drawSimpleField(margin, yPos, pageWidth - (margin * 2), label, value);
    return yPos + 8;
  };
  
  const drawSimpleHeader = (title, yPos) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, margin, yPos);
    // Simple underline
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    return yPos + 10;
  };
  
  // Set font
  doc.setFont('helvetica');
  
  // Simple Header - matching Birth Details style
  let yPos = 20;
  
  // Basic government header
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  doc.setFontSize(12);
  doc.text('CITY GOVERNMENT OF DAVAO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  const facilityName = birthCareInfo?.name?.toUpperCase() || 'PAANAKAN CENTER';
  doc.setFontSize(10);
  doc.text(facilityName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  
  const address = birthCareInfo?.description || birthCareInfo?.address || 'Paanakan Center, Sandawa Phase 2, Ecoland Davao City';
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(address, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  // Simple form title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PRENATAL EXAMINATION FORM', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  
  // MOTHER INFORMATION Section - matching Birth Details style
  yPos = drawSimpleHeader('MOTHER INFORMATION', yPos);
  
  if (patientData) {
    const fullName = `${patientData.first_name} ${patientData.middle_name || ''} ${patientData.last_name}`.trim();
    const dateOfBirthFormatted = formatDateOnly(patientData.date_of_birth);
    
    yPos = drawSimpleFullWidth(yPos, "Mother's Name", fullName);
    yPos = drawSimpleTwoColumns(yPos, 'Date of Birth', dateOfBirthFormatted, 'Age', patientData.age);
    yPos = drawSimpleFullWidth(yPos, 'Address', patientData.address);
    yPos = drawSimpleFullWidth(yPos, 'Contact Number', patientData.contact_number);
    yPos += 5;
  }
  
  // EXAMINATION DETAILS Section - matching Birth Details style
  yPos = drawSimpleHeader('EXAMINATION DETAILS', yPos);
  
  const examDateFormatted = formatDateOnly(formData.form_date);
  yPos = drawSimpleTwoColumns(yPos, 'Examination Date', examDateFormatted, 'Gestational Age', formData.gestational_age);
  yPos = drawSimpleTwoColumns(yPos, 'Weight', formData.weight, 'Blood Pressure', formData.blood_pressure);
  yPos = drawSimpleFullWidth(yPos, 'Next Appointment', formData.next_appointment);
  yPos = drawSimpleFullWidth(yPos, 'Examined By', formData.examined_by);
  yPos += 8;
  
  // Clinical Notes Section
  if (formData.notes) {
    yPos = drawSimpleHeader('CLINICAL NOTES & OBSERVATIONS', yPos);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(String(formData.notes), pageWidth - (margin * 2));
    lines.forEach(line => {
      doc.text(line, margin, yPos);
      yPos += 5;
    });
  }
    
  return doc;
};

export const savePrenatalFormAsPDF = async (formData, patientData, birthcare_Id, birthCareInfo = null) => {
  try {
    const doc = generatePrenatalFormPDF(formData, patientData, birthCareInfo);
    const pdfBlob = doc.output('blob');
    
    // Convert blob to base64
    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });
    
    // Generate base title
    const patientName = `${patientData.first_name}_${patientData.last_name}`;
    const baseTitle = `Prenatal_Form_${patientName}_${formData.form_date}`;
    
    // Generate unique title with deduplication
    const uniqueTitle = await generateUniqueDocumentTitle(baseTitle, birthcare_Id, patientData.id);
    
    return {
      base64PDF,
      title: uniqueTitle,
      document_type: 'prenatal_form',
      metadata: {
        form_date: formData.form_date,
        gestational_age: formData.gestational_age,
        weight: formData.weight,
        blood_pressure: formData.blood_pressure,
        examined_by: formData.examined_by,
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error('Failed to generate PDF');
  }
};

export const downloadPrenatalFormPDF = (formData, patientData, birthCareInfo = null) => {
  try {
    const doc = generatePrenatalFormPDF(formData, patientData, birthCareInfo);
    const patientName = `${patientData.first_name}_${patientData.last_name}`;
    const filename = `Prenatal_Form_${patientName}_${formData.form_date}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('PDF download failed:', error);
    throw new Error('Failed to download PDF');
  }
};

// Patient Chart PDF Generator
export const generatePatientChartPDF = (chartData, birthCareInfo = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Set font
  doc.setFont('helvetica');
  
  // Official Header
  let yPos = 20;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  doc.setFontSize(12);
  doc.text('CITY GOVERNMENT OF DAVAO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  const facilityName = birthCareInfo?.name?.toUpperCase() || 'BIRTH CARE FACILITY';
  doc.setFontSize(10);
  doc.text(facilityName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  
  const address = birthCareInfo?.description || birthCareInfo?.address || 'Health Care Services';
  doc.setFontSize(8);
  doc.text(address, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  // Add PATIENT CHART title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT CHART', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  // Helper function to add section headers
  const addSectionHeader = (title, sectionYPos) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, sectionYPos);
    return sectionYPos + 8;
  };
  
  // Helper function to add field with value
  const addField = (label, value, xPos, fieldYPos, width = 80) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${label}:`, xPos, fieldYPos);
    
    // Draw line for value
    const labelWidth = doc.getTextWidth(`${label}: `);
    const lineY = fieldYPos + 1;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(xPos + labelWidth, lineY, xPos + width, lineY);
    
    // Add value if exists
    if (value) {
      doc.setFontSize(8);
      const displayValue = String(value).substring(0, 30); // Limit length
      doc.text(displayValue, xPos + labelWidth + 2, fieldYPos - 1);
    }
    
    return fieldYPos;
  };
  
  // Check if we need a new page
  const checkNewPage = (requiredSpace) => {
    if (yPos + requiredSpace > pageHeight - 20) {
      doc.addPage();
      return 20;
    }
    return yPos;
  };
  
  // 1. Patient Information
  yPos = checkNewPage(50);
  yPos = addSectionHeader('1. Patient Information', yPos);
  
  addField('Patient Name', chartData.patientInfo?.patientName, 20, yPos, 100);
  addField('Age', chartData.patientInfo?.age, 130, yPos, 50);
  yPos += 8;
  
  addField('Address', chartData.patientInfo?.address, 20, yPos, 160);
  yPos += 8;
  
  addField('Contact No.', chartData.patientInfo?.contactNumber, 20, yPos, 80);
  const gravida = chartData.patientInfo?.gravida;
  const para = chartData.patientInfo?.para;
  addField('G/P', `${gravida || ''}/${para || ''}`, 110, yPos, 50);
  yPos += 8;
  
  addField('EDD', chartData.patientInfo?.edd, 20, yPos, 80);
  addField('Room No.', chartData.patientInfo?.roomNumber, 110, yPos, 40);
  addField('Bed No.', chartData.patientInfo?.bedNumber, 160, yPos, 30);
  yPos += 8;
  
  addField('Admission Date/Time', chartData.patientInfo?.admissionDateTime, 20, yPos, 100);
  addField('Midwife', chartData.patientInfo?.attendingMidwife, 130, yPos, 60);
  yPos += 15;
  
  // 2. Medical & Obstetric History
  yPos = checkNewPage(40);
  yPos = addSectionHeader('2. Medical & Obstetric History', yPos);
  
  addField('Allergies', chartData.medicalHistory?.allergies, 20, yPos, 160);
  yPos += 8;
  addField('Past Illnesses', chartData.medicalHistory?.pastIllnesses, 20, yPos, 160);
  yPos += 8;
  addField('Previous Pregnancies', chartData.medicalHistory?.previousPregnancies, 20, yPos, 160);
  yPos += 8;
  addField('LMP', chartData.medicalHistory?.lmp, 20, yPos, 80);
  addField('Prenatal Check-ups', chartData.medicalHistory?.prenatalCheckups, 110, yPos, 50);
  yPos += 8;
  addField('Supplements', chartData.medicalHistory?.supplements, 20, yPos, 160);
  yPos += 15;
  
  // 3. Admission Assessment
  yPos = checkNewPage(40);
  yPos = addSectionHeader('3. Admission Assessment', yPos);
  
  addField('BP', `${chartData.admissionAssessment?.bloodPressure || ''} mmHg`, 20, yPos, 40);
  addField('HR', `${chartData.admissionAssessment?.heartRate || ''} bpm`, 70, yPos, 35);
  addField('Temp', `${chartData.admissionAssessment?.temperature || ''} °C`, 115, yPos, 35);
  addField('RR', `${chartData.admissionAssessment?.respiratoryRate || ''} /min`, 160, yPos, 35);
  yPos += 8;
  
  addField('FHR', `${chartData.admissionAssessment?.fetalHeartRate || ''} bpm`, 20, yPos, 50);
  addField('Cervical Dilatation', `${chartData.admissionAssessment?.cervicalDilatation || ''} cm`, 80, yPos, 60);
  yPos += 8;
  
  addField('Membranes', chartData.admissionAssessment?.membranes, 20, yPos, 60);
  addField('Presenting Part', chartData.admissionAssessment?.presentingPart, 90, yPos, 70);
  yPos += 15;
  
  // 4. Delivery Record
  yPos = checkNewPage(40);
  yPos = addSectionHeader('4. Delivery Record', yPos);
  
  addField('Date/Time of Delivery', chartData.deliveryRecord?.dateTimeDelivery, 20, yPos, 100);
  addField('Type of Delivery', chartData.deliveryRecord?.typeOfDelivery, 130, yPos, 60);
  yPos += 8;
  
  addField('Baby\'s Sex', chartData.deliveryRecord?.babySex, 20, yPos, 50);
  addField('Birth Weight', `${chartData.deliveryRecord?.birthWeight || ''} kg`, 80, yPos, 50);
  yPos += 8;
  
  const apgar1 = chartData.deliveryRecord?.apgarScore1Min;
  const apgar5 = chartData.deliveryRecord?.apgarScore5Min;
  addField('Apgar Score (1/5 min)', `${apgar1 || ''}/${apgar5 || ''}`, 20, yPos, 70);
  addField('EBL', `${chartData.deliveryRecord?.estimatedBloodLoss || ''} mL`, 100, yPos, 50);
  yPos += 8;
  
  addField('Placenta', chartData.deliveryRecord?.placenta, 20, yPos, 70);
  yPos += 15;
  
  // Check if we need a new page for remaining sections
  yPos = checkNewPage(80);
  
  // 5. Newborn Care
  yPos = addSectionHeader('5. Newborn Care', yPos);
  
  addField('Initial Cry', chartData.newbornCare?.initialCry, 20, yPos, 50);
  addField('Cord Care', chartData.newbornCare?.cordCare, 80, yPos, 40);
  yPos += 8;
  
  addField('Vit. K', chartData.newbornCare?.vitaminKGiven, 20, yPos, 40);
  addField('Eye Ointment', chartData.newbornCare?.eyeOintment, 70, yPos, 40);
  addField('Breastfeeding', chartData.newbornCare?.breastfeedingInitiated, 120, yPos, 50);
  yPos += 8;
  
  addField('Complications', chartData.newbornCare?.complications, 20, yPos, 160);
  yPos += 15;
  
  // 6. Postpartum Notes
  yPos = addSectionHeader('6. Postpartum Notes', yPos);
  
  addField('Fundus', chartData.postpartumNotes?.fundus, 20, yPos, 80);
  addField('Lochia', chartData.postpartumNotes?.lochia, 110, yPos, 50);
  yPos += 8;
  
  addField('BP', `${chartData.postpartumNotes?.bloodPressure || ''} mmHg`, 20, yPos, 50);
  addField('Pulse', `${chartData.postpartumNotes?.pulse || ''} bpm`, 80, yPos, 50);
  addField('Temp', `${chartData.postpartumNotes?.temperature || ''} °C`, 140, yPos, 50);
  yPos += 8;
  
  addField('Pain', chartData.postpartumNotes?.pain, 20, yPos, 160);
  yPos += 15;
  
  // 7. Discharge Summary
  yPos = addSectionHeader('7. Discharge Summary', yPos);
  
  addField('Mother\'s Condition', chartData.dischargeSummary?.motherCondition, 20, yPos, 80);
  addField('Baby\'s Condition', chartData.dischargeSummary?.babyCondition, 110, yPos, 70);
  yPos += 8;
  
  addField('Follow-up Schedule', chartData.dischargeSummary?.followUpSchedule, 20, yPos, 160);
  yPos += 8;
  
  addField('Midwife-in-Charge', chartData.dischargeSummary?.midwifeInCharge, 20, yPos, 160);
  yPos += 15;
  
  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, footerY);
  const facilityFooterName = birthCareInfo?.name || 'Birth Care Facility';
  doc.text(facilityFooterName, 20, footerY + 4);
  
  return doc;
};

// Save Patient Chart as PDF for database storage
export const savePatientChartAsPDF = async (chartData, birthcare_Id, patient_id, birthCareInfo = null) => {
  try {
    const doc = generatePatientChartPDF(chartData, birthCareInfo);
    const pdfBlob = doc.output('blob');
    
    // Convert blob to base64
    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });
    
    // Generate base title
    const patientName = chartData.patientInfo?.patientName?.replace(/\s+/g, '_') || 'Patient';
    const baseTitle = `Patient_Chart_${patientName}_${new Date().toISOString().split('T')[0]}`;
    
    // Generate unique title with deduplication
    const uniqueTitle = await generateUniqueDocumentTitle(baseTitle, birthcare_Id, patient_id);
    
    return {
      base64PDF,
      title: uniqueTitle,
      document_type: 'patient_chart',
      metadata: {
        patient_name: chartData.patientInfo?.patientName,
        admission_date: chartData.patientInfo?.admissionDateTime,
        delivery_date: chartData.deliveryRecord?.dateTimeDelivery,
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Patient Chart PDF generation failed:', error);
    throw new Error('Failed to generate Patient Chart PDF');
  }
};

// Download Patient Chart PDF
export const downloadPatientChartPDF = (chartData, birthCareInfo = null) => {
  try {
    const doc = generatePatientChartPDF(chartData, birthCareInfo);
    const patientName = chartData.patientInfo?.patientName?.replace(/\s+/g, '_') || 'Patient';
    const filename = `Patient_Chart_${patientName}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Patient Chart PDF download failed:', error);
    throw new Error('Failed to download Patient Chart PDF');
  }
};

// Labor Monitoring PDF Generator
export const generateLaborMonitoringPDF = (patientData, monitoringEntries, additionalInfo, birthCareInfo = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Set font
  doc.setFont('helvetica');
  
  // Official Header - Republic of the Philippines
  let yPos = 25;
  
  // Republic of the Philippines
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  // City Government of Davao
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal', 'bold');
  doc.text('CITY GOVERNMENT OF DAVAO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  // Medical Center Name - use birthcare info or fallback
  const facilityName = birthCareInfo?.name?.toUpperCase() || 'BIRTH CARE FACILITY';
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal', 'bold');
  doc.text(facilityName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  // Address
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal', 'bold');
  const address = birthCareInfo?.description || birthCareInfo?.address || 'Health Care Services';
  doc.text(address, pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;
  
  // Title border and form name
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(30, yPos, pageWidth - 30, yPos);
  yPos += 8;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal', 'bold');
  doc.text('LABOR MONITORING SHEET', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  doc.line(30, yPos, pageWidth - 30, yPos);
  yPos += 15;
  
  // Patient Information Section
  doc.setFontSize(10);
  if (patientData) {
    const fullName = `${patientData.first_name} ${patientData.middle_name || ''} ${patientData.last_name}`.trim();
    const margin = 20;
    const leftX = margin;
    const rightX = (pageWidth / 2) + margin; // start right column after mid-page

    const drawLabelValue = (x, y, label, value) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, x, y);
      const labelWidth = doc.getTextWidth(label + ' ');
      doc.setFont('helvetica', 'normal');
      doc.text(String(value || 'N/A'), x + labelWidth, y);
    };

    // Row 1
    drawLabelValue(leftX, yPos, 'Name:', fullName);
    drawLabelValue(rightX, yPos, 'Case No:', additionalInfo?.case_no);
    yPos += 6;

    // Row 2
    drawLabelValue(leftX, yPos, 'Date of Admission:', additionalInfo?.admission_date);
    drawLabelValue(rightX, yPos, 'Bed No:', additionalInfo?.bed_no);
    yPos += 6;

    // Row 3
    drawLabelValue(leftX, yPos, 'Room No:', additionalInfo?.room_no);
    yPos += 10;
  }
  
  // Monitoring Table
  const tableStartY = yPos;
  const colWidths = [25, 20, 20, 20, 20, 25, 40];
  const colStartX = [20, 45, 65, 85, 105, 125, 150];
  const headers = ['DATE', 'TIME', 'TEMP', 'PULSE', 'RESP', 'BP', 'FHT/LOCATION'];
  
  // Table headers
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Draw header row
  for (let i = 0; i < headers.length; i++) {
    doc.rect(colStartX[i], yPos, colWidths[i], 8);
    doc.text(headers[i], colStartX[i] + colWidths[i] / 2, yPos + 5, { align: 'center' });
  }
  yPos += 8;
  
  // Table data rows
  const maxRows = 20;
  const rowHeight = 6;
  
  for (let i = 0; i < maxRows; i++) {
    const entry = monitoringEntries[i];
    
    for (let j = 0; j < colWidths.length; j++) {
      doc.rect(colStartX[j], yPos, colWidths[j], rowHeight);
    }
    
    if (entry) {
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        } catch (e) {
          return dateStr;
        }
      };
      
      const formatTime = (timeStr) => {
        if (!timeStr) return '';
        try {
          if (timeStr.includes('T')) {
            const date = new Date(timeStr);
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          }
          return timeStr.split(':').slice(0, 2).join(':');
        } catch (e) {
          return timeStr;
        }
      };
      
      const data = [
        formatDate(entry.monitoring_date),
        formatTime(entry.monitoring_time),
        entry.temperature || '',
        entry.pulse || '',
        entry.respiration || '',
        entry.blood_pressure || '',
        entry.fht_location || ''
      ];
      
      for (let j = 0; j < data.length; j++) {
        doc.text(String(data[j]), colStartX[j] + colWidths[j] / 2, yPos + 4, { align: 'center' });
      }
    }
    
    yPos += rowHeight;
  }
  
  // Signature section
  yPos += 15;
  doc.setFontSize(8);
  const sigWidth = 80;
  const rightMargin = 20;
  const lineStartX = pageWidth - rightMargin - sigWidth;
  const lineEndX = pageWidth - rightMargin;
  const sigCenterX = (lineStartX + lineEndX) / 2;
  // Draw right-aligned signature line

  const attendingPhysician = additionalInfo?.attending_physician || 'Attending Physician';
  doc.text(attendingPhysician, sigCenterX, yPos, { align: 'center' });
  doc.line(lineStartX, yPos + 2, lineEndX, yPos + 2);
  yPos += 5;
  doc.text('Attending Physician', sigCenterX, yPos, { align: 'center' });

  
  return doc;
};

export const saveLaborMonitoringAsPDF = async (patientData, monitoringEntries, additionalInfo, birthcare_Id, birthCareInfo = null) => {
  try {
    const doc = generateLaborMonitoringPDF(patientData, monitoringEntries, additionalInfo, birthCareInfo);
    const pdfBlob = doc.output('blob');
    
    // Convert blob to base64
    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });
    
    // Generate base title
    const patientName = `${patientData.first_name}_${patientData.last_name}`;
    const baseTitle = `Labor_Monitoring_${patientName}_${new Date().toISOString().split('T')[0]}`;
    
    // Generate unique title with deduplication
    const uniqueTitle = await generateUniqueDocumentTitle(baseTitle, birthcare_Id, patientData.id);
    
    return {
      base64PDF,
      title: uniqueTitle,
      document_type: 'labor_monitoring',
      metadata: {
        patient_name: `${patientData.first_name} ${patientData.last_name}`,
        admission_date: additionalInfo?.admission_date,
        case_no: additionalInfo?.case_no,
        bed_no: additionalInfo?.bed_no,
        entries_count: monitoringEntries.length,
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Labor monitoring PDF generation failed:', error);
    throw new Error('Failed to generate labor monitoring PDF');
  }
};

export const downloadLaborMonitoringPDF = (patientData, monitoringEntries, additionalInfo, birthCareInfo = null) => {
  try {
    const doc = generateLaborMonitoringPDF(patientData, monitoringEntries, additionalInfo, birthCareInfo);
    const patientName = `${patientData.first_name}_${patientData.last_name}`;
    const filename = `Labor_Monitoring_${patientName}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Labor monitoring PDF download failed:', error);
    throw new Error('Failed to download labor monitoring PDF');
  }
};

// Newborn Screening PDF Generator - Redesigned to match Birth Details style
export const generateNewbornScreeningPDF = (screeningData, birthCareInfo = null) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Helper functions similar to Birth Details PDF
  const drawSimpleField = (x, y, width, label, value, bold = false) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`${label}:`, x, y);
    
    if (value && value !== 'N/A' && value !== '') {
      const valueText = String(value);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      // Simple underline for value
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.line(x + labelWidth, y + 1, x + width, y + 1);
      doc.text(valueText, x + labelWidth + 2, y - 1);
    } else {
      // Draw empty line
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.line(x + labelWidth, y + 1, x + width, y + 1);
    }
  };
  
  const drawSimpleTwoColumns = (yPos, leftLabel, leftValue, rightLabel, rightValue) => {
    const margin = 20;
    const colWidth = 80;
    drawSimpleField(margin, yPos, colWidth, leftLabel, leftValue);
    drawSimpleField(margin + 90, yPos, colWidth, rightLabel, rightValue);
    return yPos + 8;
  };
  
  const drawSimpleFullWidth = (yPos, label, value) => {
    const margin = 20;
    drawSimpleField(margin, yPos, pageWidth - (margin * 2), label, value);
    return yPos + 8;
  };
  
  const drawSimpleHeader = (title, yPos) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, 20, yPos);
    // Simple underline
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);
    return yPos + 10;
  };
  
  // Set font
  doc.setFont('helvetica');
  
  // Simple Header - matching Birth Details style
  let yPos = 20;
  
  // Basic government header
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  doc.setFontSize(12);
  doc.text('CITY GOVERNMENT OF DAVAO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  // Medical Center Name - use birthcare info or fallback
  const facilityName = birthCareInfo?.name?.toUpperCase() || 'BIRTH CARE FACILITY';
  doc.setFontSize(10);
  doc.text(facilityName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  
  // Address
  doc.setFontSize(8);
  const address = birthCareInfo?.description || birthCareInfo?.address || 'Health Care Services';
  doc.text(address, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  // Simple form title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NEWBORN SCREENING RECORD', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  
  // CHILD INFORMATION Section
  yPos = drawSimpleHeader('CHILD INFORMATION', yPos);
  
  yPos = drawSimpleFullWidth(yPos, "Child's Name", screeningData.childName);
  yPos = drawSimpleTwoColumns(yPos, 'Date of Birth', screeningData.dateOfBirth, 'Sex', screeningData.sex);
  
  const weightValue = screeningData.birthWeight ? `${screeningData.birthWeight} grams` : null;
  const gestationalValue = screeningData.gestationalAge ? `${screeningData.gestationalAge} weeks` : null;
  yPos = drawSimpleTwoColumns(yPos, 'Birth Weight', weightValue, 'Gestational Age', gestationalValue);
  yPos = drawSimpleFullWidth(yPos, 'Screening ID', screeningData.screeningId);
  yPos += 5;
  
  // MOTHER'S INFORMATION Section
  yPos = drawSimpleHeader("MOTHER'S INFORMATION", yPos);
  
  const ageValue = screeningData.motherAge ? `${screeningData.motherAge} years` : null;
  yPos = drawSimpleTwoColumns(yPos, "Mother's Name", screeningData.motherName, 'Age', ageValue);
  yPos = drawSimpleFullWidth(yPos, 'Address', screeningData.address);
  yPos = drawSimpleFullWidth(yPos, 'Phone Number', screeningData.phoneNumber);
  yPos += 5;
  
  // SAMPLE COLLECTION INFORMATION Section
  yPos = drawSimpleHeader('SAMPLE COLLECTION INFORMATION', yPos);
  
  // Handle nested sample collection data
  const sampleData = screeningData.sampleCollection || {};
  const ageAtCollectionValue = sampleData.ageAtCollection || screeningData.ageAtCollection;
  const qualityValue = sampleData.quality || screeningData.sampleQuality;
  const methodValue = sampleData.method || screeningData.collectionMethod;
  const feedingValue = sampleData.feedingStatus || screeningData.feedingStatus;
  const collectorValue = sampleData.collectorName || screeningData.collectorName;
  const laboratoryValue = sampleData.laboratory || screeningData.laboratory;
  
  const ageCollectionDisplay = ageAtCollectionValue ? `${ageAtCollectionValue} hours` : null;
  yPos = drawSimpleTwoColumns(yPos, 'Age at Collection', ageCollectionDisplay, 'Sample Quality', qualityValue);
  yPos = drawSimpleTwoColumns(yPos, 'Collection Method', methodValue, 'Feeding Status', feedingValue);
  yPos = drawSimpleFullWidth(yPos, 'Sample Collector', collectorValue);
  yPos = drawSimpleFullWidth(yPos, 'Laboratory', laboratoryValue);
  yPos += 8;
  
  // SCREENING TESTS Section (Table Layout) - similar to APGAR table in Birth Details
  yPos = drawSimpleHeader('SCREENING TESTS', yPos);
  
  // Table setup
  const margin = 20;
  const tableStartX = margin;
  const tableWidth = pageWidth - (margin * 2);
  const colWidths = [60, 18, 22, 20, 22, 23]; // Test name (reduced width), Taken, Date Collected, Time, Result, Date Reported
  const rowHeight = 10; // Increased row height for better text fit
  const headerHeight = 12;
  
  // Draw table header
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  
  // Header background (light gray)
  doc.setFillColor(240, 240, 240);
  doc.rect(tableStartX, yPos, tableWidth, headerHeight, 'FD');
  
  // Header text
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  let xPos = tableStartX;
  const headers = ['Screening Test', 'Taken', 'Date Collected', 'Time', 'Result', 'Date Reported'];
  
  headers.forEach((header, index) => {
    // Draw vertical line
    if (index > 0) {
      doc.line(xPos, yPos, xPos, yPos + headerHeight);
    }
    // Center text in column
    doc.text(header, xPos + colWidths[index] / 2, yPos + 7, { align: 'center' });
    xPos += colWidths[index];
  });
  
  yPos += headerHeight;
  
  // Test data - handle both nested and flat structure
  const tests = screeningData.tests || [
    { name: 'Congenital Hypothyroidism (CH)', sampleTaken: false, dateCollected: '', timeCollected: '', result: '', dateReported: '' },
    { name: 'Congenital Adrenal Hyperplasia (CAH)', sampleTaken: false, dateCollected: '', timeCollected: '', result: '', dateReported: '' },
    { name: 'Galactosemia (GAL)', sampleTaken: false, dateCollected: '', timeCollected: '', result: '', dateReported: '' },
    { name: 'Phenylketonuria (PKU)', sampleTaken: false, dateCollected: '', timeCollected: '', result: '', dateReported: '' },
    { name: 'G6PD Deficiency', sampleTaken: false, dateCollected: '', timeCollected: '', result: '', dateReported: '' },
    { name: 'Maple Syrup Urine Disease (MSUD)', sampleTaken: false, dateCollected: '', timeCollected: '', result: '', dateReported: '' }
  ];
  
  // Draw table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  tests.forEach((test, index) => {
    // Alternating row background
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(tableStartX, yPos, tableWidth, rowHeight, 'F');
    }
    
    // Draw row borders
    doc.setFillColor(255, 255, 255); // Reset fill color
    doc.rect(tableStartX, yPos, tableWidth, rowHeight, 'S');
    
    // Draw vertical lines for columns
    xPos = tableStartX;
    for (let i = 1; i < colWidths.length; i++) {
      xPos += colWidths[i - 1];
      doc.line(xPos, yPos, xPos, yPos + rowHeight);
    }
    
    // Add text content
    xPos = tableStartX;
    
    // Test name with improved wrapping
    const testName = test.name || '';
    doc.setFontSize(7);
    
    // Handle long test names better
    let displayName = testName;
    if (testName.length > 35) {
      // For very long names, use abbreviations
      const abbreviations = {
        'Congenital Hypothyroidism (CH)': 'Congenital Hypothyroidism (CH)',
        'Congenital Adrenal Hyperplasia (CAH)': 'Congenital Adrenal Hyperplasia (CAH)',
        'Galactosemia (GAL)': 'Galactosemia (GAL)',
        'Phenylketonuria (PKU)': 'Phenylketonuria (PKU)',
        'Glucose-6-Phosphate Dehydrogenase Deficiency (G6PD)': 'G6PD Deficiency',
        'Maple Syrup Urine Disease (MSUD)': 'Maple Syrup Urine Disease (MSUD)'
      };
      displayName = abbreviations[testName] || testName.substring(0, 32) + '...';
    }
    
    // Split text into lines if still too long
    const lines = doc.splitTextToSize(displayName, colWidths[0] - 4);
    if (lines.length > 1) {
      doc.text(lines[0], xPos + 2, yPos + 4);
      if (lines[1]) {
        doc.text(lines[1], xPos + 2, yPos + 8);
      }
    } else {
      doc.text(lines[0], xPos + 2, yPos + 6);
    }
    xPos += colWidths[0];
    
    doc.setFontSize(8);
    // Sample taken
    doc.text(test.sampleTaken ? 'Yes' : 'No', xPos + colWidths[1] / 2, yPos + 6, { align: 'center' });
    xPos += colWidths[1];
    
    // Date collected
    if (test.dateCollected) {
      const dateStr = new Date(test.dateCollected).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
      doc.text(dateStr, xPos + colWidths[2] / 2, yPos + 6, { align: 'center' });
    }
    xPos += colWidths[2];
    
    // Time collected
    if (test.timeCollected) {
      doc.text(test.timeCollected, xPos + colWidths[3] / 2, yPos + 6, { align: 'center' });
    }
    xPos += colWidths[3];
    
    // Result
    if (test.result) {
      doc.text(test.result, xPos + colWidths[4] / 2, yPos + 6, { align: 'center' });
    }
    xPos += colWidths[4];
    
    // Date reported
    if (test.dateReported) {
      const reportDateStr = new Date(test.dateReported).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
      doc.text(reportDateStr, xPos + colWidths[5] / 2, yPos + 6, { align: 'center' });
    }
    
    yPos += rowHeight;
  });
  
  // Force new page for FOLLOW-UP ACTIONS and SIGNATURES
  doc.addPage();
  yPos = 30;
  
  // FOLLOW-UP ACTIONS Section - no underline
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('FOLLOW-UP ACTIONS', 20, yPos);
  yPos += 10;
  
  // Reset any fill colors and ensure proper text color
  doc.setFillColor(255, 255, 255); // White background
  doc.setTextColor(0, 0, 0); // Black text
  doc.setDrawColor(0, 0, 0); // Black lines
  
  // Handle nested followUp structure
  const followUpData = screeningData.followUp || {};
  const actions = followUpData.actions || screeningData.followUpActions || [];
  const comments = followUpData.comments || screeningData.comments || '';
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  if (actions && actions.length > 0) {
    actions.forEach(action => {
      if (action && action.trim()) {
        doc.text(`• ${action}`, margin + 5, yPos);
        yPos += 6;
      }
    });
  } else {
    doc.text('• No specific actions required', margin + 5, yPos);
    yPos += 6;
  }
  
  // Comments section
  if (comments && comments.trim()) {
    yPos += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('Comments:', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const splitComments = doc.splitTextToSize(String(comments), pageWidth - (margin * 2) - 10);
    splitComments.forEach(line => {
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });
  }
  
  yPos += 15;
  
  // Signatures Section - centered title, no underline
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('SIGNATURES', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const signatureY = yPos + 5;
  const signatureWidth = 50;
  const signatureSpacing = (pageWidth - (margin * 2)) / 3;
  
  // Extract signature names from screeningData
  const signatures = screeningData.signatures || {};
  const collectorName = signatures.sampleCollector || '';
  const labTechName = signatures.labTechnician || '';
  const physicianName = signatures.attendingPhysician || '';
  
  // Collector's Name signature
  // Display the name above the line (centered)
  const collectorCenterX = margin + (signatureWidth / 2);
  if (collectorName) {
    doc.setFont('helvetica', 'bold');
    doc.text(collectorName, collectorCenterX, signatureY - 3, { align: 'center' });
  }
  doc.setFont('helvetica', 'normal');
  doc.line(margin, signatureY, margin + signatureWidth, signatureY);
  doc.text('Collector\'s Name', collectorCenterX, signatureY + 5, { align: 'center' });
  
  // Laboratory Technician signature
  const labX = margin + signatureSpacing;
  const labCenterX = labX + (signatureWidth / 2);
  if (labTechName) {
    doc.setFont('helvetica', 'bold');
    doc.text(labTechName, labCenterX, signatureY - 3, { align: 'center' });
  }
  doc.setFont('helvetica', 'normal');
  doc.line(labX, signatureY, labX + signatureWidth, signatureY);
  doc.text('Laboratory Technician', labCenterX, signatureY + 5, { align: 'center' });
  
  // Attending Physician signature
  const physicianX = margin + (signatureSpacing * 2);
  const physicianCenterX = physicianX + (signatureWidth / 2);
  if (physicianName) {
    doc.setFont('helvetica', 'bold');
    doc.text(physicianName, physicianCenterX, signatureY - 3, { align: 'center' });
  }
  doc.setFont('helvetica', 'normal');
  doc.line(physicianX, signatureY, physicianX + signatureWidth, signatureY);
  doc.text('Attending Physician', physicianCenterX, signatureY + 5, { align: 'center' });
  
  // Add some space after signatures
  yPos = signatureY + 20;
  
  return doc;
};

export const saveNewbornScreeningAsPDF = async (screeningData, birthcare_Id, patient_id = null, birthCareInfo = null) => {
  try {
    const doc = generateNewbornScreeningPDF(screeningData, birthCareInfo);
    const pdfBlob = doc.output('blob');
    
    // Convert blob to base64
    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });
    
    // Generate base title
    const childName = screeningData.childName ? screeningData.childName.replace(/\s+/g, '_') : 'Newborn';
    const baseTitle = `Newborn_Screening_${childName}_${new Date().toISOString().split('T')[0]}`;
    
    // Generate unique title with deduplication
    const uniqueTitle = await generateUniqueDocumentTitle(baseTitle, birthcare_Id, patient_id);
    
    return {
      base64PDF,
      title: uniqueTitle,
      document_type: 'newborn_screening',
      metadata: {
        child_name: screeningData.childName,
        date_of_birth: screeningData.dateOfBirth,
        screening_id: screeningData.screeningId,
        mother_name: screeningData.motherName,
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Newborn screening PDF generation failed:', error);
    throw new Error('Failed to generate newborn screening PDF');
  }
};

export const downloadNewbornScreeningPDF = (screeningData, birthCareInfo = null) => {
  try {
    const doc = generateNewbornScreeningPDF(screeningData, birthCareInfo);
    const childName = screeningData.childName ? screeningData.childName.replace(/\s+/g, '_') : 'Newborn';
    const filename = `Newborn_Screening_${childName}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Newborn screening PDF download failed:', error);
    throw new Error('Failed to download newborn screening PDF');
  }
};

// Certificate of Live Birth PDF Generator
export const generateCertificateOfLiveBirthPDF = (certificateData, birthCareInfo = null) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Set font
  doc.setFont('helvetica');
  
  let yPos = 20;
  
  // Official Header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  doc.setFontSize(12);
  doc.text('OFFICE OF THE CIVIL REGISTRAR-GENERAL', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  
  doc.setFontSize(14);
  doc.text('CERTIFICATE OF LIVE BIRTH', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  
  
  yPos += 10;
  
  // Registry Information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const leftMargin = 20;
  const rightMargin = pageWidth - 20;
  
  // Province and City
  doc.text('Province: ' + (certificateData.province || '_____________'), leftMargin, yPos);
  doc.text('City/Municipality: ' + (certificateData.city || '_____________'), pageWidth / 2, yPos);
  yPos += 8;
  
  doc.text('Registry No.: ' + (certificateData.registryNo || '_____________'), leftMargin, yPos);
  yPos += 12;
  
  // CHILD SECTION
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CHILD', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Child's Name
  doc.text('1. NAME:', leftMargin, yPos);
  yPos += 5;
  doc.text('First: ' + (certificateData.childFirstName || '_____________'), leftMargin + 5, yPos);
  doc.text('Middle: ' + (certificateData.childMiddleName || '_____________'), leftMargin + 70, yPos);
  doc.text('Last: ' + (certificateData.childLastName || '_____________'), leftMargin + 135, yPos);
  yPos += 10;
  
  // Sex and Date of Birth
  doc.text('2. SEX: ' + (certificateData.sex || '_____'), leftMargin, yPos);
  doc.text('3. DATE OF BIRTH: ' + (certificateData.dateOfBirth || '_____________'), pageWidth / 2, yPos);
  yPos += 8;
  
  // Place of Birth
  doc.text('4. PLACE OF BIRTH:', leftMargin, yPos);
  yPos += 5;
  doc.text('Hospital/Institution: ' + (certificateData.placeOfBirth || '_________________________'), leftMargin + 5, yPos);
  yPos += 5;
  doc.text('City: ' + (certificateData.birthCity || '_________'), leftMargin + 5, yPos);
  doc.text('Province: ' + (certificateData.birthProvince || '_________'), pageWidth / 2, yPos);
  yPos += 10;
  
  // Type of Birth and Birth Order
  doc.text('5. TYPE OF BIRTH: ' + (certificateData.typeOfBirth || '_____'), leftMargin, yPos);
  doc.text('6. BIRTH ORDER: ' + (certificateData.birthOrder || '_____'), pageWidth / 2, yPos);
  yPos += 8;
  
  doc.text('7. WEIGHT AT BIRTH: ' + (certificateData.weightAtBirth || '_____') + ' grams', leftMargin, yPos);
  yPos += 15;
  
  // MOTHER SECTION
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('MOTHER', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Mother's Maiden Name
  doc.text('8. MAIDEN NAME:', leftMargin, yPos);
  yPos += 5;
  doc.text('First: ' + (certificateData.motherFirstName || '_____________'), leftMargin + 5, yPos);
  doc.text('Middle: ' + (certificateData.motherMiddleName || '_____________'), leftMargin + 70, yPos);
  doc.text('Last: ' + (certificateData.motherLastName || '_____________'), leftMargin + 135, yPos);
  yPos += 10;
  
  // Mother's Details
  doc.text('9. CITIZENSHIP: ' + (certificateData.motherCitizenship || '_________'), leftMargin, yPos);
  doc.text('10. RELIGION: ' + (certificateData.motherReligion || '_________'), pageWidth / 2, yPos);
  yPos += 8;
  
  doc.text('11. OCCUPATION: ' + (certificateData.motherOccupation || '_____________'), leftMargin, yPos);
  doc.text('12. AGE: ' + (certificateData.motherAge || '___') + ' years', pageWidth / 2, yPos);
  yPos += 10;
  
  // Mother's Residence
  doc.text('13. RESIDENCE: ' + (certificateData.motherResidence || '_____________________'), leftMargin, yPos);
  yPos += 15;
  
  // FATHER SECTION
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FATHER', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Father's Name
  doc.text('14. NAME:', leftMargin, yPos);
  yPos += 5;
  doc.text('First: ' + (certificateData.fatherFirstName || '_____________'), leftMargin + 5, yPos);
  doc.text('Middle: ' + (certificateData.fatherMiddleName || '_____________'), leftMargin + 70, yPos);
  doc.text('Last: ' + (certificateData.fatherLastName || '_____________'), leftMargin + 135, yPos);
  yPos += 10;
  
  // Father's Details
  doc.text('15. CITIZENSHIP: ' + (certificateData.fatherCitizenship || '_________'), leftMargin, yPos);
  doc.text('16. RELIGION: ' + (certificateData.fatherReligion || '_________'), pageWidth / 2, yPos);
  yPos += 8;
  
  doc.text('17. OCCUPATION: ' + (certificateData.fatherOccupation || '_____________'), leftMargin, yPos);
  doc.text('18. AGE: ' + (certificateData.fatherAge || '___') + ' years', pageWidth / 2, yPos);
  yPos += 10;
  
  // Marriage Information
  doc.text('19. DATE AND PLACE OF MARRIAGE:', leftMargin, yPos);
  yPos += 5;
  doc.text(certificateData.marriageInfo || '_________________________________', leftMargin + 5, yPos);
  yPos += 15;
  
  // Attendant Information
  doc.text('20. ATTENDANT: ' + (certificateData.attendant || '_____________'), leftMargin, yPos);
  yPos += 8;
  
  // Birth Facility Information
  const facilityName = birthCareInfo?.name || certificateData.birthFacility || 'Birth Care Facility';
  doc.text('Birth Facility: ' + facilityName, leftMargin, yPos);
  yPos += 8;
  
  // Certification
  doc.text('I hereby certify that this child was born alive at the above facility.', leftMargin, yPos);
  yPos += 15;
  
  // Signature Section
  doc.text('_________________________', leftMargin, yPos);
  doc.text('_________________________', pageWidth / 2 + 10, yPos);
  yPos += 5;
  doc.text('Attending Physician/Midwife', leftMargin, yPos);
  doc.text('Civil Registrar', pageWidth / 2 + 10, yPos);
  yPos += 5;
  doc.text('Name and Signature', leftMargin, yPos);
  doc.text('Name and Signature', pageWidth / 2 + 10, yPos);
  
  return doc;
};

export const saveCertificateOfLiveBirthAsPDF = async (certificateData, birthcare_Id, patient_id = null, birthCareInfo = null) => {
  try {
    const doc = generateCertificateOfLiveBirthPDF(certificateData, birthCareInfo);
    const pdfBlob = doc.output('blob');
    
    // Convert blob to base64
    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });
    
    // Generate base title
    const childName = certificateData.childFirstName && certificateData.childLastName 
      ? `${certificateData.childFirstName}_${certificateData.childLastName}`.replace(/\s+/g, '_')
      : 'Certificate';
    const baseTitle = `Certificate_Live_Birth_${childName}_${new Date().toISOString().split('T')[0]}`;
    
    // Generate unique title with deduplication
    const uniqueTitle = await generateUniqueDocumentTitle(baseTitle, birthcare_Id, patient_id);
    
    return {
      base64PDF,
      title: uniqueTitle,
      document_type: 'certificate_live_birth',
      metadata: {
        child_name: `${certificateData.childFirstName || ''} ${certificateData.childLastName || ''}`.trim(),
        date_of_birth: certificateData.dateOfBirth,
        registry_no: certificateData.registryNo,
        mother_name: `${certificateData.motherFirstName || ''} ${certificateData.motherLastName || ''}`.trim(),
        father_name: `${certificateData.fatherFirstName || ''} ${certificateData.fatherLastName || ''}`.trim(),
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Certificate of Live Birth PDF generation failed:', error);
    throw new Error('Failed to generate certificate of live birth PDF');
  }
};

export const downloadCertificateOfLiveBirthPDF = (certificateData, birthCareInfo = null) => {
  try {
    const doc = generateCertificateOfLiveBirthPDF(certificateData, birthCareInfo);
    const childName = certificateData.childFirstName && certificateData.childLastName 
      ? `${certificateData.childFirstName}_${certificateData.childLastName}`.replace(/\s+/g, '_')
      : 'Certificate';
    const filename = `Certificate_Live_Birth_${childName}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Certificate of Live Birth PDF download failed:', error);
    throw new Error('Failed to download certificate of live birth PDF');
  }
};

/**
 * Generate a professional PDF for patient referral (BACKUP - Original Version)
 * @param {Object} referralData - The referral data object
 * @param {Array} patients - Array of patients to find patient details
 * @returns {jsPDF} - The generated PDF document
 */
export const generateReferralPDFOriginal = async (referralData, patients = []) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addWrappedText = (text, x, y, maxWidth, lineHeight = 7) => {
    if (!text) return y;
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * lineHeight);
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Header with logo placeholder and title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 80, 180);
  pdf.text('PATIENT REFERRAL FORM', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Referral ID and Date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Referral ID: ${referralData.id || 'N/A'}`, margin, yPosition);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, yPosition);
  yPosition += 10;

  // Draw separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Patient Information Section
  const selectedPatient = patients.find(p => p.id == referralData.patient_id);
  if (selectedPatient) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 80, 180);
    pdf.text('PATIENT INFORMATION', margin, yPosition);
    yPosition += 8;
    
    // Patient details in a structured format
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    const patientName = `${selectedPatient.first_name || ''} ${selectedPatient.middle_name || ''} ${selectedPatient.last_name || ''}`.trim();
    pdf.text(`Full Name: ${patientName}`, margin + 5, yPosition);
    yPosition += 6;
    
    if (selectedPatient.date_of_birth) {
      pdf.text(`Date of Birth: ${selectedPatient.date_of_birth}`, margin + 5, yPosition);
      yPosition += 6;
    }
    
    if (selectedPatient.gender) {
      pdf.text(`Gender: ${selectedPatient.gender}`, margin + 5, yPosition);
      yPosition += 6;
    }
    
    if (selectedPatient.phone_number) {
      pdf.text(`Phone: ${selectedPatient.phone_number}`, margin + 5, yPosition);
      yPosition += 6;
    }
    
    if (selectedPatient.address) {
      yPosition = addWrappedText(`Address: ${selectedPatient.address}`, margin + 5, yPosition, pageWidth - 2 * margin - 10, 6);
    }
    
    yPosition += 8;
  }

  checkNewPage();

  // Referral Details Section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 80, 180);
  pdf.text('REFERRAL DETAILS', margin, yPosition);
  yPosition += 8;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Create a grid for referral information
  const leftColumn = margin + 5;
  const rightColumn = pageWidth / 2 + 10;
  
  pdf.text(`Date: ${referralData.referral_date || 'Not specified'}`, leftColumn, yPosition);
  pdf.text(`Time: ${referralData.referral_time || 'Not specified'}`, rightColumn, yPosition);
  yPosition += 6;
  
  pdf.text(`Urgency Level: ${(referralData.urgency_level || 'routine').toUpperCase()}`, leftColumn, yPosition);
  pdf.text(`Status: ${(referralData.status || 'pending').toUpperCase()}`, rightColumn, yPosition);
  yPosition += 10;

  checkNewPage();

  // Facilities Information Section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 80, 180);
  pdf.text('FACILITY INFORMATION', margin, yPosition);
  yPosition += 8;
  
  // Referring Facility
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('FROM (Referring Facility):', margin + 5, yPosition);
  yPosition += 6;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Facility: ${referralData.referring_facility || 'Not specified'}`, margin + 10, yPosition);
  yPosition += 5;
  pdf.text(`Physician: ${referralData.referring_physician || 'Not specified'}`, margin + 10, yPosition);
  yPosition += 5;
  
  if (referralData.referring_physician_contact) {
    yPosition = addWrappedText(`Contact: ${referralData.referring_physician_contact}`, margin + 10, yPosition, pageWidth - 2 * margin - 20, 5);
  }
  yPosition += 8;
  
  // Receiving Facility
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TO (Receiving Facility):', margin + 5, yPosition);
  yPosition += 6;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Facility: ${referralData.receiving_facility || 'Not specified'}`, margin + 10, yPosition);
  yPosition += 5;
  
  if (referralData.receiving_physician) {
    pdf.text(`Physician: ${referralData.receiving_physician}`, margin + 10, yPosition);
    yPosition += 5;
  }
  
  if (referralData.receiving_physician_contact) {
    yPosition = addWrappedText(`Contact: ${referralData.receiving_physician_contact}`, margin + 10, yPosition, pageWidth - 2 * margin - 20, 5);
  }
  yPosition += 10;

  checkNewPage();

  // Clinical Information Section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 80, 180);
  pdf.text('CLINICAL INFORMATION', margin, yPosition);
  yPosition += 8;
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  if (referralData.reason_for_referral) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Reason for Referral:', margin + 5, yPosition);
    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(referralData.reason_for_referral, margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 5;
  }
  
  if (referralData.clinical_summary) {
    checkNewPage(25);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Clinical Summary:', margin + 5, yPosition);
    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(referralData.clinical_summary, margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 5;
  }
  
  if (referralData.current_diagnosis) {
    checkNewPage(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Current Diagnosis:', margin + 5, yPosition);
    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(referralData.current_diagnosis, margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 5;
  }
  
  if (referralData.relevant_history) {
    checkNewPage(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Relevant Medical History:', margin + 5, yPosition);
    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(referralData.relevant_history, margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 5;
  }
  
  if (referralData.current_medications) {
    checkNewPage(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Current Medications:', margin + 5, yPosition);
    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(referralData.current_medications, margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 5;
  }
  
  if (referralData.allergies) {
    checkNewPage(15);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Allergies & Adverse Reactions:', margin + 5, yPosition);
    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(referralData.allergies, margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 5;
  }
  
  if (referralData.vital_signs) {
    checkNewPage(15);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Current Vital Signs:', margin + 5, yPosition);
    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(referralData.vital_signs, margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 8;
  }

  // Test Results & Treatment Section
  if (referralData.laboratory_results || referralData.imaging_results || referralData.treatment_provided) {
    checkNewPage(25);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 80, 180);
    pdf.text('TEST RESULTS & TREATMENT', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    if (referralData.laboratory_results) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Laboratory Results:', margin + 5, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(referralData.laboratory_results, margin + 5, yPosition, pageWidth - 2 * margin - 10);
      yPosition += 5;
    }
    
    if (referralData.imaging_results) {
      checkNewPage(15);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Imaging Results:', margin + 5, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(referralData.imaging_results, margin + 5, yPosition, pageWidth - 2 * margin - 10);
      yPosition += 5;
    }
    
    if (referralData.treatment_provided) {
      checkNewPage(15);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Treatment Provided:', margin + 5, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(referralData.treatment_provided, margin + 5, yPosition, pageWidth - 2 * margin - 10);
      yPosition += 8;
    }
  }

  // Transfer & Care Details Section
  checkNewPage(25);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 80, 180);
  pdf.text('TRANSFER & CARE DETAILS', margin, yPosition);
  yPosition += 8;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Two column layout for transfer details
  pdf.text(`Patient Condition: ${referralData.patient_condition || 'Not specified'}`, leftColumn, yPosition);
  pdf.text(`Transportation: ${referralData.transportation_mode || 'ambulance'}`, rightColumn, yPosition);
  yPosition += 6;
  
  if (referralData.accompanies_patient) {
    pdf.text(`Accompanies Patient: ${referralData.accompanies_patient}`, leftColumn, yPosition);
    yPosition += 6;
  }
  
  if (referralData.equipment_required) {
    pdf.text(`Equipment Required: ${referralData.equipment_required}`, leftColumn, yPosition);
    yPosition += 6;
  }
  
  if (referralData.isolation_precautions) {
    pdf.text(`Isolation Precautions: ${referralData.isolation_precautions}`, leftColumn, yPosition);
    yPosition += 6;
  }
  
  if (referralData.anticipated_care_level) {
    pdf.text(`Anticipated Care Level: ${referralData.anticipated_care_level}`, leftColumn, yPosition);
    yPosition += 6;
  }
  
  if (referralData.special_instructions) {
    yPosition += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Special Instructions:', margin + 5, yPosition);
    yPosition += 5;
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(referralData.special_instructions, margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 8;
  }

  // Contact Information Section
  if (referralData.family_contact_name || referralData.insurance_information) {
    checkNewPage(20);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 80, 180);
    pdf.text('CONTACT & INSURANCE INFORMATION', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    if (referralData.family_contact_name) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Emergency Contact:', margin + 5, yPosition);
      yPosition += 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${referralData.family_contact_name}`, margin + 10, yPosition);
      yPosition += 5;
      
      if (referralData.family_contact_phone) {
        pdf.text(`Phone: ${referralData.family_contact_phone}`, margin + 10, yPosition);
        yPosition += 5;
      }
      
      if (referralData.family_contact_relationship) {
        pdf.text(`Relationship: ${referralData.family_contact_relationship}`, margin + 10, yPosition);
        yPosition += 5;
      }
      yPosition += 5;
    }
    
    if (referralData.insurance_information) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Insurance Information:', margin + 5, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(referralData.insurance_information, margin + 10, yPosition, pageWidth - 2 * margin - 20);
      yPosition += 8;
    }
  }

  // Additional Notes Section
  if (referralData.notes) {
    checkNewPage(20);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 80, 180);
    pdf.text('ADDITIONAL NOTES', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    yPosition = addWrappedText(referralData.notes, margin + 5, yPosition, pageWidth - 2 * margin - 10);
    yPosition += 10;
  }

  // Footer with signatures section
  checkNewPage(40);
  
  yPosition = Math.max(yPosition, pageHeight - 60);
  
  // Draw separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  // Signature section
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 80, 180);
  pdf.text('SIGNATURES', margin, yPosition);
  yPosition += 10;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Referring physician signature
  pdf.text('Referring Physician:', margin, yPosition);
  pdf.line(margin + 35, yPosition + 2, margin + 100, yPosition + 2);
  pdf.text('Date:', margin + 110, yPosition);
  pdf.line(margin + 125, yPosition + 2, margin + 170, yPosition + 2);
  yPosition += 15;
  
  // Receiving physician signature
  pdf.text('Receiving Physician:', margin, yPosition);
  pdf.line(margin + 40, yPosition + 2, margin + 100, yPosition + 2);
  pdf.text('Date:', margin + 110, yPosition);
  pdf.line(margin + 125, yPosition + 2, margin + 170, yPosition + 2);
  
  // Footer with generation details
  const currentDateTime = new Date().toLocaleString();
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(128, 128, 128);
  pdf.text(`Generated on: ${currentDateTime}`, margin, pageHeight - 15);
  pdf.text('Birthcare Management System', margin, pageHeight - 10);
  pdf.text('This is a system-generated document', pageWidth - margin - 60, pageHeight - 10);
  
  return pdf;
};

/**
 * Generate a clean, professional referral PDF with simple form layout
 * @param {Object} referralData - The referral data object
 * @param {Array} patients - Array of patients to find patient details
 * @param {Object} birthCareInfo - Birth care facility information (optional)
 * @returns {jsPDF} - The generated PDF document
 */
export const generateReferralPDF = async (referralData, patients = [], birthCareInfo = null) => {
  const doc = new jsPDF();
  // Helper to ensure text is a string for jsPDF
  const asText = (v) => (v === undefined || v === null ? '' : String(v));
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const footerHeight = 30;
  
  // Helper function to check if we need a new page
  const checkNewPage = (currentY, neededSpace = 20) => {
    if (currentY + neededSpace > pageHeight - footerHeight) {
      doc.addPage();
      return addHeader(20);
    }
    return currentY;
  };
  
  // Helper function to draw table cell with border
  const drawCell = (label, value, x, y, width, height, isHeader = false) => {
    // Draw cell border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    
    if (isHeader) {
      doc.setFillColor(240, 240, 240); // Light gray background for headers
      doc.rect(x, y, width, height, 'FD');
    } else {
      doc.setFillColor(255, 255, 255); // White background
      doc.rect(x, y, width, height, 'FD');
    }
    
    // Draw label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(label, x + 2, y + 4);
    
    // Draw value if exists and not header
    if (value && value !== '' && !isHeader) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(String(value), width - 6);
      doc.text(lines, x + 2, y + 9);
    }
    
    return y + height;
  };
  
  // Helper function to draw text area cell
  const drawTextCell = (label, value, x, y, width, height) => {
    // Draw cell border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, width, height, 'FD');
    
    // Draw label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(label + ':', x + 2, y + 5);
    
    // Draw value if exists
    if (value && value !== '') {
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(String(value), width - 6);
      doc.text(lines, x + 2, y + 12);
    }
    
    return y + height;
  };
  
  // Helper function to draw section header
  const drawSectionHeader = (title, x, y, width) => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.setFillColor(220, 220, 220); // Darker gray for section headers
    doc.rect(x, y, width, 10, 'FD'); // Reduced from 12 to 10
    
    doc.setFontSize(9); // Reduced from 10 to 9
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, x + 2, y + 7); // Adjusted position
    
    return y + 10; // Reduced from 12 to 10
  };
  
  // Header function
  const addHeader = (yPosition) => {
    // Official header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    
    doc.setFontSize(12);
    doc.text('CITY GOVERNMENT OF DAVAO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    
    // Facility name
    const facilityName = birthCareInfo?.name?.toUpperCase() || 'BIRTHING CLINIC';
    doc.setFontSize(11);
    doc.text(facilityName, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    
    // Address
    const address = birthCareInfo?.address || 'Birthing Clinic, 123 Street, Davao City';
    doc.setFontSize(9);
    doc.text(address, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Form title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT REFERRAL FORM', pageWidth / 2, yPosition, { align: 'center' });
    
    return yPosition + 20;
  };
  
  // Set font
  doc.setFont('helvetica');
  let yPos = addHeader(20);
  
  // Get selected patient data
  const selectedPatient = patients.find(p => p.id == referralData.patient_id);
  const patientName = selectedPatient 
    ? `${selectedPatient.first_name || ''} ${selectedPatient.middle_name || ''} ${selectedPatient.last_name || ''}`.trim()
    : 'Unknown Patient';
  
  const tableWidth = pageWidth - (margin * 2);
  const cellHeight = 12; // Reduced from 15 to 12
  const textCellHeight = 18; // Reduced from 25 to 18
  const sectionSpacing = 3; // Minimal spacing between sections
  
  // Patient Information Section
  yPos = checkNewPage(yPos, 50);
  yPos = drawSectionHeader('Patient Information', margin, yPos, tableWidth);
  
  // Row 1: First name, Last name, Date of birth
  const col1 = tableWidth / 3;
  const col2 = tableWidth / 3;
  const col3 = tableWidth / 3;
  
  drawCell('First name:', selectedPatient?.first_name, margin, yPos, col1, cellHeight);
  drawCell('Last name:', selectedPatient?.last_name, margin + col1, yPos, col2, cellHeight);
  drawCell('Date of birth:', selectedPatient?.date_of_birth, margin + col1 + col2, yPos, col3, cellHeight);
  yPos += cellHeight;
  
  // Row 2: Email, Phone
  drawCell('Email:', selectedPatient?.email, margin, yPos, col1 + col2, cellHeight);
  drawCell('Phone number:', selectedPatient?.phone_number, margin + col1 + col2, yPos, col3, cellHeight);
  yPos += cellHeight;
  
  // Row 3: Address (full width)
  drawCell('Address:', selectedPatient?.address, margin, yPos, tableWidth, cellHeight);
  yPos += cellHeight + sectionSpacing;
  
  // Referral Information Section
  yPos = checkNewPage(yPos, 40);
  yPos = drawSectionHeader('Referral Information', margin, yPos, tableWidth);
  
  // Row 1: Date, Time, Urgency
  drawCell('Referral Date:', referralData.referral_date, margin, yPos, col1, cellHeight);
  drawCell('Time:', referralData.referral_time, margin + col1, yPos, col2, cellHeight);
  drawCell('Urgency Level:', referralData.urgency_level?.toUpperCase(), margin + col1 + col2, yPos, col3, cellHeight);
  yPos += cellHeight;
  
  // Row 2: Status, ID
  drawCell('Status:', referralData.status?.toUpperCase(), margin, yPos, col1 + col2, cellHeight);
  drawCell('Referral ID:', referralData.id, margin + col1 + col2, yPos, col3, cellHeight);
  yPos += cellHeight + sectionSpacing;
  
  // Facility Information Section (Combined)
  yPos = checkNewPage(yPos, 60);
  yPos = drawSectionHeader('Facility Information', margin, yPos, tableWidth);
  
  // Referring facility info - more compact
  drawCell('From - Facility:', referralData.referring_facility, margin, yPos, tableWidth, cellHeight);
  yPos += cellHeight;
  
  drawCell('Physician:', referralData.referring_physician, margin, yPos, col1 + col2, cellHeight);
  drawCell('Contact:', referralData.referring_physician_contact, margin + col1 + col2, yPos, col3, cellHeight);
  yPos += cellHeight;
  
  // Receiving facility info - compact
  drawCell('To - Facility:', referralData.receiving_facility, margin, yPos, tableWidth, cellHeight);
  yPos += cellHeight;
  
  drawCell('Physician:', referralData.receiving_physician, margin, yPos, col1 + col2, cellHeight);
  drawCell('Contact:', referralData.receiving_physician_contact, margin + col1 + col2, yPos, col3, cellHeight);
  yPos += cellHeight + sectionSpacing;
  
  // Clinical Information Section - more compact
  yPos = checkNewPage(yPos, 70);
  yPos = drawSectionHeader('Clinical Information', margin, yPos, tableWidth);
  
  // Reason for referral - smaller text area
  yPos = drawTextCell('Reason for referral', referralData.reason_for_referral, margin, yPos, tableWidth, textCellHeight);
  
  // Clinical summary - only if exists
  if (referralData.clinical_summary) {
    yPos = drawTextCell('Clinical Summary', referralData.clinical_summary, margin, yPos, tableWidth, textCellHeight);
  }
  
  // Current diagnosis and vital signs
  drawCell('Current Diagnosis:', referralData.current_diagnosis, margin, yPos, col1 + col2, cellHeight);
  drawCell('Vital Signs:', referralData.vital_signs, margin + col1 + col2, yPos, col3, cellHeight);
  yPos += cellHeight + sectionSpacing;
  
  // Transfer Details Section - compact
  yPos = checkNewPage(yPos, 40);
  yPos = drawSectionHeader('Transfer Details', margin, yPos, tableWidth);
  
  drawCell('Patient Condition:', referralData.patient_condition, margin, yPos, col1 + col2, cellHeight);
  drawCell('Transportation:', referralData.transportation_mode, margin + col1 + col2, yPos, col3, cellHeight);
  yPos += cellHeight;
  
  // Special instructions - smaller if exists
  if (referralData.special_instructions) {
    yPos = drawTextCell('Special Instructions', referralData.special_instructions, margin, yPos, tableWidth, textCellHeight);
  }
  yPos += sectionSpacing;
  
  // Emergency Contact Section - compact
  if (referralData.family_contact_name) {
    yPos = checkNewPage(yPos, 35);
    yPos = drawSectionHeader('Emergency Contact', margin, yPos, tableWidth);
    
    drawCell('Contact Name:', referralData.family_contact_name, margin, yPos, col1 + col2, cellHeight);
    drawCell('Phone:', referralData.family_contact_phone, margin + col1 + col2, yPos, col3, cellHeight);
    yPos += cellHeight;
    
    drawCell('Relationship:', referralData.family_contact_relationship, margin, yPos, tableWidth, cellHeight);
    yPos += cellHeight + sectionSpacing;
  }
  
  // Signatures Section - more compact
  yPos = checkNewPage(yPos, 45);
  yPos = drawSectionHeader('Signatures', margin, yPos, tableWidth);
  
  // Compact signature table
  drawCell('Referring Physician:', referralData.referring_physician, margin, yPos, col1 + col2, cellHeight);
  drawCell('Date:', '', margin + col1 + col2, yPos, col3, cellHeight);
  yPos += cellHeight;
  
  drawCell('Receiving Physician:', referralData.receiving_physician, margin, yPos, col1 + col2, cellHeight);
  drawCell('Date:', '', margin + col1 + col2, yPos, col3, cellHeight);
  yPos += cellHeight;
  yPos += 15;
  
  // Simple Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, pageHeight - 15);
  doc.text('Birth Care Management System', margin, pageHeight - 10);
  
  return doc;
};

/**
 * Download referral PDF with proper filename
 * @param {Object} referralData - The referral data
 * @param {Array} patients - Array of patients
 * @param {string} filename - Optional custom filename
 */
export const downloadReferralPDF = async (referralData, patients = [], filename = null, birthCareInfo = null) => {
  try {
    const pdf = await generateReferralPDF(referralData, patients, birthCareInfo);
    
    // Generate filename if not provided
    let pdfFilename = filename;
    if (!pdfFilename) {
      const selectedPatient = patients.find(p => p.id == referralData.patient_id);
      const patientName = selectedPatient 
        ? `${selectedPatient.first_name}_${selectedPatient.last_name}`.replace(/\s+/g, '_')
        : 'patient';
      const dateStr = new Date().toISOString().split('T')[0];
      pdfFilename = `referral_${patientName}_${dateStr}.pdf`;
    }
    
    pdf.save(pdfFilename);
    return true;
  } catch (error) {
    console.error('Error generating/downloading PDF:', error);
    throw error;
  }
};

/**
 * Save referral PDF as document to patient's file
 * @param {Object} referralData - The referral data
 * @param {Array} patients - Array of patients
 * @param {string} birthcare_Id - The birthcare facility ID
 * @returns {Object} - Document data for saving
 */
export const saveReferralPDFAsDocument = async (referralData, patients, birthcare_Id, birthCareInfo = null) => {
  try {
    const pdf = await generateReferralPDF(referralData, patients, birthCareInfo);
    const pdfBlob = pdf.output('blob');
    
    // Convert blob to base64
    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });
    
    // Get patient info for filename and metadata
    const selectedPatient = patients.find(p => p.id == referralData.patient_id);
    const patientName = selectedPatient 
      ? `${selectedPatient.first_name}_${selectedPatient.last_name}`
      : 'Unknown_Patient';
    
    const baseTitle = `Patient_Referral_${patientName}_${referralData.referral_date || new Date().toISOString().split('T')[0]}`;
    
    // Generate unique title with deduplication
    const uniqueTitle = await generateUniqueDocumentTitle(baseTitle, birthcare_Id, referralData.patient_id);
    
    return {
      base64PDF,
      title: uniqueTitle,
      document_type: 'referral',
      metadata: {
        referral_id: referralData.id,
        patient_id: referralData.patient_id,
        referral_date: referralData.referral_date,
        urgency_level: referralData.urgency_level,
        referring_facility: referralData.referring_facility,
        receiving_facility: referralData.receiving_facility,
        status: referralData.status,
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('PDF generation for document storage failed:', error);
    throw new Error('Failed to generate referral PDF for document storage');
  }
};

// Birth Details Record PDF Generator - Simplified Layout
export const generateBirthDetailsPDF = (birthDetails, patientData, birthCareInfo = null) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Simple helper functions
  const drawSimpleField = (x, y, width, label, value, bold = false) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`${label}:`, x, y);
    
    if (value && value !== 'N/A') {
      const valueText = String(value);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      // Simple underline for value
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.line(x + labelWidth, y + 1, x + width, y + 1);
      doc.text(valueText, x + labelWidth + 2, y - 1);
    } else {
      // Draw empty line
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.line(x + labelWidth, y + 1, x + width, y + 1);
    }
  };
  
  const drawSimpleTwoColumns = (yPos, leftLabel, leftValue, rightLabel, rightValue) => {
    const margin = 20;
    const colWidth = 80;
    drawSimpleField(margin, yPos, colWidth, leftLabel, leftValue);
    drawSimpleField(margin + 90, yPos, colWidth, rightLabel, rightValue);
    return yPos + 8;
  };
  
  const drawSimpleFullWidth = (yPos, label, value) => {
    const margin = 20;
    drawSimpleField(margin, yPos, pageWidth - (margin * 2), label, value);
    return yPos + 8;
  };
  
  const drawSimpleHeader = (title, yPos) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, 20, yPos);
    // Simple underline
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);
    return yPos + 10;
  };
  
  // Simple Header
  let yPos = 20;
  
  // Basic government header
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  doc.setFontSize(12);
  doc.text('CITY GOVERNMENT OF DAVAO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  const facilityName = birthCareInfo?.name?.toUpperCase() || 'BIRTH CARE FACILITY';
  doc.setFontSize(10);
  doc.text(facilityName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  
  const address = birthCareInfo?.description || birthCareInfo?.address || 'Health Care Services';
  doc.setFontSize(8);
  doc.text(address, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  // Simple form title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BIRTH DETAILS & APGAR SCORE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  // MOTHER INFORMATION Section
  yPos = drawSimpleHeader('MOTHER INFORMATION', yPos);
  
  if (patientData) {
    const fullName = `${patientData.first_name} ${patientData.middle_name || ''} ${patientData.last_name}`.trim();
    yPos = drawSimpleTwoColumns(yPos, "Mother's Name", fullName, 'Age', patientData.age);
    yPos = drawSimpleFullWidth(yPos, 'Address', patientData.address);
    yPos += 5;
  }
  
  // BIRTH INFORMATION Section
  yPos = drawSimpleHeader('BIRTH INFORMATION', yPos);
  
  yPos = drawSimpleFullWidth(yPos, "Baby's Name", birthDetails.baby_name);
  yPos = drawSimpleTwoColumns(yPos, 'Date of Birth', birthDetails.date_of_birth, 'Time of Birth', birthDetails.time_of_birth);
  yPos = drawSimpleFullWidth(yPos, 'Place of Birth', birthDetails.place_of_birth);
  
  const sexValue = birthDetails.sex ? birthDetails.sex.charAt(0).toUpperCase() + birthDetails.sex.slice(1) : null;
  const weightValue = birthDetails.weight ? `${birthDetails.weight} grams` : null;
  yPos = drawSimpleTwoColumns(yPos, 'Sex', sexValue, 'Weight', weightValue);
  
  const lengthValue = birthDetails.length ? `${birthDetails.length} cm` : null;
  yPos = drawSimpleTwoColumns(yPos, 'Length', lengthValue, 'Attendant', birthDetails.attendant_name);
  yPos += 8;
  
  // APGAR SCORES Section (Table Layout)
  if (birthDetails.apgar_scores) {
    yPos = drawSimpleHeader('APGAR SCORE', yPos);
    
    const oneMinTotal = birthDetails.apgar_scores.one_minute?.total || 0;
    const fiveMinTotal = birthDetails.apgar_scores.five_minutes?.total || 0;
    
    // Table setup
    const margin = 20;
    const tableStartX = margin;
    const tableWidth = pageWidth - (margin * 2);
    const colWidths = [80, 40, 40]; // Criteria, 1 Min, 5 Min
    const rowHeight = 8;
    const headerHeight = 10;
    
    // Draw table header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    
    // Header background (light gray)
    doc.setFillColor(240, 240, 240);
    doc.rect(tableStartX, yPos, tableWidth, headerHeight, 'FD');
    
    // Header text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Criteria', tableStartX + 5, yPos + 6);
    doc.text('1 Min', tableStartX + colWidths[0] + 15, yPos + 6);
    doc.text('5 Min', tableStartX + colWidths[0] + colWidths[1] + 15, yPos + 6);
    
    yPos += headerHeight;
    
    // APGAR criteria data
    const apgarCriteria = [
      { name: 'Activity', oneMin: birthDetails.apgar_scores.one_minute?.activity || 0, fiveMin: birthDetails.apgar_scores.five_minutes?.activity || 0 },
      { name: 'Pulse', oneMin: birthDetails.apgar_scores.one_minute?.pulse || 0, fiveMin: birthDetails.apgar_scores.five_minutes?.pulse || 0 },
      { name: 'Grimace', oneMin: birthDetails.apgar_scores.one_minute?.grimace || 0, fiveMin: birthDetails.apgar_scores.five_minutes?.grimace || 0 },
      { name: 'Appearance', oneMin: birthDetails.apgar_scores.one_minute?.appearance || 0, fiveMin: birthDetails.apgar_scores.five_minutes?.appearance || 0 },
      { name: 'Respiration', oneMin: birthDetails.apgar_scores.one_minute?.respiration || 0, fiveMin: birthDetails.apgar_scores.five_minutes?.respiration || 0 }
    ];
    
    // Draw table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    apgarCriteria.forEach((criteria, index) => {
      // Alternating row background
      if (index % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(tableStartX, yPos, tableWidth, rowHeight, 'F');
      }
      
      // Draw row borders
      doc.setFillColor(255, 255, 255); // Reset fill color
      doc.rect(tableStartX, yPos, tableWidth, rowHeight, 'S');
      
      // Draw vertical lines for columns
      doc.line(tableStartX + colWidths[0], yPos, tableStartX + colWidths[0], yPos + rowHeight);
      doc.line(tableStartX + colWidths[0] + colWidths[1], yPos, tableStartX + colWidths[0] + colWidths[1], yPos + rowHeight);
      
      // Add text content
      doc.text(criteria.name, tableStartX + 5, yPos + 5.5);
      doc.text(String(criteria.oneMin), tableStartX + colWidths[0] + 20, yPos + 5.5, { align: 'center' });
      doc.text(String(criteria.fiveMin), tableStartX + colWidths[0] + colWidths[1] + 20, yPos + 5.5, { align: 'center' });
      
      yPos += rowHeight;
    });
    
    // Total row with bold styling
    doc.setFillColor(230, 230, 230);
    doc.rect(tableStartX, yPos, tableWidth, rowHeight, 'FD');
    
    // Draw vertical lines for total row
    doc.line(tableStartX + colWidths[0], yPos, tableStartX + colWidths[0], yPos + rowHeight);
    doc.line(tableStartX + colWidths[0] + colWidths[1], yPos, tableStartX + colWidths[0] + colWidths[1], yPos + rowHeight);
    
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', tableStartX + 5, yPos + 5.5);
    doc.text(String(oneMinTotal), tableStartX + colWidths[0] + 20, yPos + 5.5, { align: 'center' });
    doc.text(String(fiveMinTotal), tableStartX + colWidths[0] + colWidths[1] + 20, yPos + 5.5, { align: 'center' });
    
    yPos += rowHeight + 8;
    
    // Simple interpretation
    const getSimpleAssessment = (score) => {
      if (score >= 7) return 'Normal';
      if (score >= 4) return 'Fair';
      return 'Critical';
    };
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`1-Min: ${oneMinTotal}/10 (${getSimpleAssessment(oneMinTotal)})`, margin, yPos);
    yPos += 6;
    doc.text(`5-Min: ${fiveMinTotal}/10 (${getSimpleAssessment(fiveMinTotal)})`, margin, yPos);
    yPos += 10;
  }
  
  return doc;
};

export const saveBirthDetailsAsPDF = async (birthDetails, patientData, birthcare_Id, birthCareInfo = null) => {
  try {
    const doc = generateBirthDetailsPDF(birthDetails, patientData, birthCareInfo);
    const pdfBlob = doc.output('blob');
    
    // Convert blob to base64
    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });
    
    // Generate base title
    const patientName = `${patientData.first_name}_${patientData.last_name}`;
    const babyName = birthDetails.baby_name ? `_${birthDetails.baby_name.replace(/\s+/g, '_')}` : '';
    const baseTitle = `Birth_Details_${patientName}${babyName}_${birthDetails.date_of_birth || new Date().toISOString().split('T')[0]}`;
    
    // Generate unique title with deduplication
    const uniqueTitle = await generateUniqueDocumentTitle(baseTitle, birthcare_Id, patientData.id);
    
    return {
      base64PDF,
      title: uniqueTitle,
      document_type: 'birth_details',
      metadata: {
        mother_name: `${patientData.first_name} ${patientData.last_name}`,
        baby_name: birthDetails.baby_name,
        date_of_birth: birthDetails.date_of_birth,
        time_of_birth: birthDetails.time_of_birth,
        place_of_birth: birthDetails.place_of_birth,
        sex: birthDetails.sex,
        weight: birthDetails.weight,
        length: birthDetails.length,
        attendant_name: birthDetails.attendant_name,
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Birth Details PDF generation failed:', error);
    throw new Error('Failed to generate Birth Details PDF');
  }
};

export const downloadBirthDetailsPDF = (birthDetails, patientData, birthCareInfo = null) => {
  try {
    const doc = generateBirthDetailsPDF(birthDetails, patientData, birthCareInfo);
    const patientName = `${patientData.first_name}_${patientData.last_name}`;
    const babyName = birthDetails.baby_name ? `_${birthDetails.baby_name.replace(/\s+/g, '_')}` : '';
    const filename = `Birth_Details_${patientName}${babyName}_${birthDetails.date_of_birth || new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Birth Details PDF download failed:', error);
    throw new Error('Failed to download Birth Details PDF');
  }
};

// Mother Discharge PDF Generator - Redesigned to match Birth Details format
export const generateMotherDischargePDF = (dischargeData, birthCareInfo = null) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  // Simple helper functions (same as Birth Details)
  const drawSimpleField = (x, y, width, label, value, bold = false) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`${label}:`, x, y);
    
    if (value && value !== 'N/A' && value !== '') {
      const valueText = String(value);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.line(x + labelWidth, y + 1, x + width, y + 1);
      doc.text(valueText, x + labelWidth + 2, y - 1);
    } else {
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.line(x + labelWidth, y + 1, x + width, y + 1);
    }
  };
  
  const drawSimpleTwoColumns = (yPos, leftLabel, leftValue, rightLabel, rightValue) => {
    const colWidth = 80;
    drawSimpleField(margin, yPos, colWidth, leftLabel, leftValue);
    drawSimpleField(margin + 90, yPos, colWidth, rightLabel, rightValue);
    return yPos + 8;
  };
  
  const drawSimpleFullWidth = (yPos, label, value) => {
    drawSimpleField(margin, yPos, pageWidth - (margin * 2), label, value);
    return yPos + 8;
  };
  
  const drawSimpleHeader = (title, yPos) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, 20, yPos);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);
    return yPos + 10;
  };
  
  const drawTextBox = (yPos, label, value, height = 20) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin, yPos);
    yPos += 5;
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, pageWidth - (margin * 2), height);
    
    if (value && value !== 'N/A' && value !== '') {
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(String(value), pageWidth - (margin * 2) - 4);
      let textY = yPos + 5;
      lines.forEach(line => {
        if (textY < yPos + height - 2) {
          doc.text(line, margin + 2, textY);
          textY += 5;
        }
      });
    }
    
    return yPos + height + 8;
  };
  
  // Set font
  doc.setFont('helvetica');
  
  // Simple Header (matching Birth Details)
  let yPos = 20;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  doc.setFontSize(12);
  doc.text('CITY GOVERNMENT OF DAVAO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  const facilityName = birthCareInfo?.name?.toUpperCase() || 'BIRTH CARE FACILITY';
  doc.setFontSize(10);
  doc.text(facilityName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  
  const address = birthCareInfo?.description || birthCareInfo?.address || 'Health Care Services';
  doc.setFontSize(8);
  doc.text(address, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  // Simple form title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MOTHER DISCHARGE INSTRUCTION', pageWidth / 2, yPos, { align: 'center'});
  yPos += 15;
  
  // PATIENT INFORMATION Section
  yPos = drawSimpleHeader('PATIENT INFORMATION', yPos);
  
  yPos = drawSimpleFullWidth(yPos, 'Patient Name', dischargeData.patientName);
  yPos = drawSimpleTwoColumns(yPos, 'Bed Number', dischargeData.bedNumber, 'Case Number', dischargeData.caseNumber);
  yPos = drawSimpleTwoColumns(yPos, 'Date Admitted', dischargeData.dateAdmitted, 'Date/Time Discharged', dischargeData.dateTimedischarged);
  yPos += 5;
  
  // DIAGNOSIS & CONDITION Section
  yPos = drawSimpleHeader('DIAGNOSIS & CONDITION', yPos);
  
  yPos = drawSimpleFullWidth(yPos, 'Discharge Diagnosis', dischargeData.dischargeDiagnosis);
  yPos = drawSimpleFullWidth(yPos, 'Final Diagnosis', dischargeData.finalDiagnosis);
  yPos = drawSimpleFullWidth(yPos, 'Condition on Discharge', dischargeData.condition);
  yPos += 5;
  
  // MEDICATIONS PRESCRIBED Section
  yPos = drawSimpleHeader('MEDICATIONS PRESCRIBED', yPos);
  
  // Draw medications table
  const tableWidth = pageWidth - (margin * 2);
  const rowHeight = 8;
  
  // Define column widths for medications
  const medNameCol = tableWidth * 0.35;  // 35% for medication name
  const dosageCol = tableWidth * 0.25;   // 25% for dosage
  const frequencyCol = tableWidth * 0.20; // 20% for frequency
  const durationCol = tableWidth * 0.20;  // 20% for duration
  
  // Table header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  
  let xPos = margin;
  
  // Draw header cells
  doc.rect(xPos, yPos, medNameCol, rowHeight);
  doc.text('Medication', xPos + 2, yPos + 5.5);
  xPos += medNameCol;
  
  doc.rect(xPos, yPos, dosageCol, rowHeight);
  doc.text('Dosage', xPos + 2, yPos + 5.5);
  xPos += dosageCol;
  
  doc.rect(xPos, yPos, frequencyCol, rowHeight);
  doc.text('Frequency', xPos + 2, yPos + 5.5);
  xPos += frequencyCol;
  
  doc.rect(xPos, yPos, durationCol, rowHeight);
  doc.text('Duration', xPos + 2, yPos + 5.5);
  
  yPos += rowHeight;
  
  // Default medications if none provided
  const defaultMedications = [
    { name: 'Iron Supplement', dosage: '1', frequency: '1', duration: '1' },
    { name: 'Folic Acid', dosage: '1', frequency: '1', duration: '1' },
    { name: 'Pain Relief', dosage: '1', frequency: '1', duration: '1' },
    { name: 'Others:', dosage: '1', frequency: '1', duration: '1' }
  ];
  
  const medsToDisplay = (dischargeData.medications && dischargeData.medications.length > 0) 
    ? dischargeData.medications 
    : defaultMedications;
  
  // Draw medication rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  medsToDisplay.forEach((med, index) => {
    xPos = margin;
    
    // Draw row cells
    doc.rect(xPos, yPos, medNameCol, rowHeight);
    const medName = med.name || '';
    const nameLines = doc.splitTextToSize(medName, medNameCol - 4);
    doc.text(nameLines[0] || '', xPos + 2, yPos + 5.5);
    xPos += medNameCol;
    
    doc.rect(xPos, yPos, dosageCol, rowHeight);
    doc.text(med.dosage || '', xPos + 2, yPos + 5.5);
    xPos += dosageCol;
    
    doc.rect(xPos, yPos, frequencyCol, rowHeight);
    doc.text(med.frequency || '', xPos + 2, yPos + 5.5);
    xPos += frequencyCol;
    
    doc.rect(xPos, yPos, durationCol, rowHeight);
    doc.text(med.duration || '', xPos + 2, yPos + 5.5);
    
    yPos += rowHeight;
  });
  
  yPos += 5;
  
  // Special Instructions and Follow-up (without section header)
  yPos = drawTextBox(yPos, 'Special Instructions for Mother', dischargeData.specialInstructions, 30);
  yPos = drawSimpleFullWidth(yPos, 'Follow-up Check-up', dischargeData.followUpCheckUp);
  yPos += 15;
  
  // Signatures (no header)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const sigWidth = 50; // width of each signature line
  const totalInnerWidth = pageWidth - (margin * 2);
  const spacing = Math.max(15, (totalInnerWidth - sigWidth * 3) / 2); // ensure visible gaps
  const sigY = yPos + 10;
  
  const x1 = margin;
  const x2 = margin + sigWidth + spacing;
  const x3 = margin + (sigWidth + spacing) * 2;
  const center = (x) => x + sigWidth / 2;
  
  // Healthcare provider (left)
  doc.text(dischargeData.staffName || '', center(x1), sigY - 2, { align: 'center' });
  doc.line(x1, sigY, x1 + sigWidth, sigY);
  doc.text('Attending Physician', center(x1), sigY + 5, { align: 'center' });
  
  // Patient (middle)
  doc.text(dischargeData.patientSignature || '', center(x2), sigY - 2, { align: 'center' });
  doc.line(x2, sigY, x2 + sigWidth, sigY);
  doc.text('Patient', center(x2), sigY + 5, { align: 'center' });
  
  // Relative/Companion (right)
  doc.text(dischargeData.relativeName || '', center(x3), sigY - 2, { align: 'center' });
  doc.line(x3, sigY, x3 + sigWidth, sigY);
  doc.text('Relative/Companion', center(x3), sigY + 5, { align: 'center' });
  
  yPos = sigY + 20;
  
  return doc;
};

export const saveMotherDischargeAsPDF = async (dischargeData, birthcare_Id, birthCareInfo = null) => {
  try {
    const doc = generateMotherDischargePDF(dischargeData, birthCareInfo);
    const pdfBlob = doc.output('blob');
    
    // Convert blob to base64
    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });
    
    // Generate title
    const patientName = dischargeData.patientName ? dischargeData.patientName.replace(/\s+/g, '_') : 'Mother';
    const title = `Mother_Discharge_${patientName}_${dischargeData.dateTimedischarged?.split('T')[0] || new Date().toISOString().split('T')[0]}`;
    
    return {
      base64PDF,
      title,
      document_type: 'mother_discharge',
      metadata: {
        patient_name: dischargeData.patientName,
        bed_number: dischargeData.bedNumber,
        case_number: dischargeData.caseNumber,
        date_admitted: dischargeData.dateAdmitted,
        date_discharged: dischargeData.dateTimedischarged,
        discharge_diagnosis: dischargeData.dischargeDiagnosis,
        final_diagnosis: dischargeData.finalDiagnosis,
        staff_name: dischargeData.staffName,
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Mother discharge PDF generation failed:', error);
    throw new Error('Failed to generate mother discharge PDF');
  }
};

export const downloadMotherDischargePDF = (dischargeData, birthCareInfo = null) => {
  try {
    const doc = generateMotherDischargePDF(dischargeData, birthCareInfo);
    const patientName = dischargeData.patientName ? dischargeData.patientName.replace(/\s+/g, '_') : 'Mother';
    const filename = `Mother_Discharge_${patientName}_${dischargeData.dateTimedischarged?.split('T')[0] || new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Mother discharge PDF download failed:', error);
    throw new Error('Failed to download mother discharge PDF');
  }
};

// Certificate of Live Birth PDF Generator
export const generateCertificateLiveBirthPDF = (certificateData, birthCareInfo = null) => {
  const doc = new jsPDF();
  // Helper to ensure text is a string for jsPDF
  const asText = (v) => (v === undefined || v === null ? 'N/A' : String(v));
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const footerHeight = 30;
  
  // Helper function to check if we need a new page
  const checkNewPage = (currentY, neededSpace = 20) => {
    if (currentY + neededSpace > pageHeight - footerHeight) {
      doc.addPage();
      return 25; // Reset to top margin
    }
    return currentY;
  };
  
  // Helper function to add header to new pages
  const addHeader = (yPosition) => {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    
    doc.setFontSize(13);
    doc.text('CITY GOVERNMENT OF DAVAO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    
    const facilityName = birthCareInfo?.name?.toUpperCase() || 'BIRTH CARE FACILITY';
    doc.setFontSize(11);
    doc.text(facilityName, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    
    doc.setFontSize(9);
    const address = birthCareInfo?.description || 'Facility Address';
    doc.text(address, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(30, yPosition, pageWidth - 30, yPosition);
    yPosition += 8;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE OF LIVE BIRTH', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    
    doc.line(30, yPosition, pageWidth - 30, yPosition);
    return yPosition + 15;
  };
  
  // Set font
  doc.setFont('helvetica');
  let yPos = addHeader(25);
  
  // Certificate Number
  yPos = checkNewPage(yPos, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Certificate No: ${asText(certificateData.certificate_number)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 15;
  
  // Child Information Section
  yPos = checkNewPage(yPos, 80);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Child Information', margin, yPos);
  yPos += 10;
  
  // Child info table
  const infoTableWidth = 170;
  const colWidth = infoTableWidth / 2;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  
  // Full Name (full width)
  doc.rect(margin, yPos, infoTableWidth, 8, 'FD');
  doc.setTextColor(0, 0, 0);
  doc.text('Full Name of Child', margin + 2, yPos + 5);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, infoTableWidth, 8, 'FD');
  doc.text(asText(certificateData.child_full_name), margin + 2, yPos + 5);
  yPos += 10;
  
  // Sex and Date of Birth
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text('Sex', margin + 2, yPos + 5);
  doc.text('Date of Birth', margin + colWidth + 2, yPos + 5);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text(asText(certificateData.child_sex), margin + 2, yPos + 5);
  doc.text(asText(certificateData.birth_date), margin + colWidth + 2, yPos + 5);
  yPos += 10;
  
  // Time and Place of Birth
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text('Time of Birth', margin + 2, yPos + 5);
  doc.text('Place of Birth', margin + colWidth + 2, yPos + 5);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text(asText(certificateData.birth_time), margin + 2, yPos + 5);
  doc.text(asText(certificateData.birth_place), margin + colWidth + 2, yPos + 5);
  yPos += 10;
  
  // Weight and Length
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text('Birth Weight (grams)', margin + 2, yPos + 5);
  doc.text('Birth Length (cm)', margin + colWidth + 2, yPos + 5);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text(asText(certificateData.birth_weight), margin + 2, yPos + 5);
  doc.text(asText(certificateData.birth_length), margin + colWidth + 2, yPos + 5);
  yPos += 15;
  
  // Mother Information Section
  yPos = checkNewPage(yPos, 60);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Mother Information', margin, yPos);
  yPos += 10;
  
  // Mother's Maiden Name (full width)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, infoTableWidth, 8, 'FD');
  doc.text('Mother\'s Full Name (Maiden Name)', margin + 2, yPos + 5);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, infoTableWidth, 8, 'FD');
  doc.text(asText(certificateData.mother_maiden_name), margin + 2, yPos + 5);
  yPos += 10;
  
  // Mother's Current Name (full width)
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, infoTableWidth, 8, 'FD');
  doc.text('Mother\'s Full Name (Current)', margin + 2, yPos + 5);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, infoTableWidth, 8, 'FD');
  doc.text(asText(certificateData.mother_current_name), margin + 2, yPos + 5);
  yPos += 10;
  
  // Mother's Age and Occupation
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text('Age', margin + 2, yPos + 5);
  doc.text('Occupation', margin + colWidth + 2, yPos + 5);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text(asText(certificateData.mother_age), margin + 2, yPos + 5);
  doc.text(asText(certificateData.mother_occupation), margin + colWidth + 2, yPos + 5);
  yPos += 15;
  
  // Father Information Section
  yPos = checkNewPage(yPos, 50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Father Information', margin, yPos);
  yPos += 10;
  
  // Father's Name (full width)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, infoTableWidth, 8, 'FD');
  doc.text('Father\'s Full Name', margin + 2, yPos + 5);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, infoTableWidth, 8, 'FD');
  doc.text(asText(certificateData.father_name), margin + 2, yPos + 5);
  yPos += 10;
  
  // Father's Age and Occupation
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text('Age', margin + 2, yPos + 5);
  doc.text('Occupation', margin + colWidth + 2, yPos + 5);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text(asText(certificateData.father_age), margin + 2, yPos + 5);
  doc.text(asText(certificateData.father_occupation), margin + colWidth + 2, yPos + 5);
  yPos += 15;
  
  // Medical Attendant Section
  yPos = checkNewPage(yPos, 40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Medical Attendant Information', margin, yPos);
  yPos += 10;
  
  // Attendant Name and Title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text('Attendant Name', margin + 2, yPos + 5);
  doc.text('Title/Position', margin + colWidth + 2, yPos + 5);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text(asText(certificateData.attendant_name), margin + 2, yPos + 5);
  doc.text(asText(certificateData.attendant_title), margin + colWidth + 2, yPos + 5);
  yPos += 10;
  
  // License Number and Facility
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text('License Number', margin + 2, yPos + 5);
  doc.text('Facility Name', margin + colWidth + 2, yPos + 5);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text(asText(certificateData.attendant_license), margin + 2, yPos + 5);
  doc.text(asText(certificateData.facility_name), margin + colWidth + 2, yPos + 5);
  yPos += 15;
  
  // Informant Section
  yPos = checkNewPage(yPos, 30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Informant Information', margin, yPos);
  yPos += 10;
  
  // Informant Name and Relationship
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text('Informant Name', margin + 2, yPos + 5);
  doc.text('Relationship to Child', margin + colWidth + 2, yPos + 5);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, colWidth, 8, 'FD');
  doc.rect(margin + colWidth, yPos, colWidth, 8, 'FD');
  doc.text(asText(certificateData.informant_name), margin + 2, yPos + 5);
  doc.text(asText(certificateData.informant_relationship), margin + colWidth + 2, yPos + 5);
  yPos += 15;
  
  // Certification Note
  yPos = checkNewPage(yPos, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  const certificationText = 'This certifies that the above information is true and correct based on the records of this facility.';
  const splitCertification = doc.splitTextToSize(certificationText, 170);
  doc.text(splitCertification, margin, yPos);
  yPos += splitCertification.length * 5 + 10;
  
  // Signature Section
  yPos = checkNewPage(yPos, 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Signature lines
  doc.text('Medical Attendant:', margin, yPos);
  doc.line(margin, yPos + 8, margin + 70, yPos + 8);
  
  doc.text('Date:', margin + 90, yPos);
  doc.line(margin + 90, yPos + 8, margin + 140, yPos + 8);
  
  yPos += 20;
  doc.text('Local Civil Registrar:', margin, yPos);
  doc.line(margin, yPos + 8, margin + 70, yPos + 8);
  
  doc.text('Date:', margin + 90, yPos);
  doc.line(margin + 90, yPos + 8, margin + 140, yPos + 8);
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, pageHeight - 15);
  const facilityFooterName = birthCareInfo?.name || 'Birth Care Facility';
  doc.text(facilityFooterName, margin, pageHeight - 10);
  
  return doc;
};

export const saveCertificateLiveBirthAsPDF = async (certificateData, birthcare_Id, birthCareInfo = null) => {
  try {
    const doc = generateCertificateLiveBirthPDF(certificateData, birthCareInfo);
    const pdfBlob = doc.output('blob');
    
    // Convert blob to base64
    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });
    
    // Generate title using only child name
    const childName = certificateData.child_full_name ? certificateData.child_full_name.replace(/\s+/g, '_') : 'Certificate';
    const title = `Certificate_Live_Birth_${childName}`;
    
    return {
      base64PDF,
      title,
      document_type: 'certificate_live_birth',
      metadata: {
        certificate_number: certificateData.certificate_number,
        child_name: certificateData.child_full_name,
        birth_date: certificateData.birth_date,
        birth_time: certificateData.birth_time,
        mother_name: certificateData.mother_current_name || certificateData.mother_maiden_name,
        father_name: certificateData.father_name,
        birth_place: certificateData.birth_place,
        attendant_name: certificateData.attendant_name,
        generated_at: new Date().toISOString(),
        form_data: certificateData
      }
    };
  } catch (error) {
    console.error('Certificate Live Birth PDF generation failed:', error);
    throw new Error('Failed to generate Certificate Live Birth PDF');
  }
};

export const downloadCertificateLiveBirthPDF = (certificateData, birthCareInfo = null) => {
  try {
    const doc = generateCertificateLiveBirthPDF(certificateData, birthCareInfo);
    const childName = certificateData.child_full_name ? certificateData.child_full_name.replace(/\s+/g, '_') : 'Certificate';
    const filename = `Certificate_Live_Birth_${childName}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Certificate Live Birth PDF download failed:', error);
    throw new Error('Failed to download Certificate Live Birth PDF');
  }
};

// Newborn Discharge PDF Generator - Redesigned to match Mother Discharge format
export const generateNewbornDischargePDF = (dischargeData, birthCareInfo = null) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  // Simple helper functions (same as Mother Discharge)
  const drawSimpleField = (x, y, width, label, value, bold = false) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`${label}:`, x, y);
    
    if (value && value !== 'N/A' && value !== '') {
      const valueText = String(value);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.line(x + labelWidth, y + 1, x + width, y + 1);
      doc.text(valueText, x + labelWidth + 2, y - 1);
    } else {
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.line(x + labelWidth, y + 1, x + width, y + 1);
    }
  };
  
  const drawSimpleTwoColumns = (yPos, leftLabel, leftValue, rightLabel, rightValue) => {
    const colWidth = 80;
    drawSimpleField(margin, yPos, colWidth, leftLabel, leftValue);
    drawSimpleField(margin + 90, yPos, colWidth, rightLabel, rightValue);
    return yPos + 8;
  };
  
  const drawSimpleFullWidth = (yPos, label, value) => {
    drawSimpleField(margin, yPos, pageWidth - (margin * 2), label, value);
    return yPos + 8;
  };
  
  const drawSimpleHeader = (title, yPos) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, 20, yPos);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, pageWidth - 20, yPos + 2);
    return yPos + 10;
  };
  
  const drawTextBox = (yPos, label, value, height = 20) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin, yPos);
    yPos += 5;
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, pageWidth - (margin * 2), height);
    
    if (value && value !== 'N/A' && value !== '') {
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(String(value), pageWidth - (margin * 2) - 4);
      let textY = yPos + 5;
      lines.forEach(line => {
        if (textY < yPos + height - 2) {
          doc.text(line, margin + 2, textY);
          textY += 5;
        }
      });
    }
    
    return yPos + height + 8;
  };
  
  // Set font
  doc.setFont('helvetica');
  
  // Simple Header (matching Mother Discharge)
  let yPos = 20;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  doc.setFontSize(12);
  doc.text('CITY GOVERNMENT OF DAVAO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  const facilityName = birthCareInfo?.name?.toUpperCase() || 'BIRTH CARE FACILITY';
  doc.setFontSize(10);
  doc.text(facilityName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  
  const address = birthCareInfo?.description || birthCareInfo?.address || 'Health Care Services';
  doc.setFontSize(8);
  doc.text(address, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  // Simple form title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NEWBORN DISCHARGE INSTRUCTION', pageWidth / 2, yPos, { align: 'center'});
  yPos += 15;
  
  // PATIENT INFORMATION Section
  yPos = drawSimpleHeader('PATIENT INFORMATION', yPos);
  
  yPos = drawSimpleFullWidth(yPos, "Mother's Name", dischargeData.motherName || dischargeData.patientName);
  yPos = drawSimpleFullWidth(yPos, "Baby's Name", dischargeData.babyName);
  yPos = drawSimpleTwoColumns(yPos, 'Bed Number', dischargeData.bedNumber, 'Case Number', dischargeData.caseNumber);
  yPos = drawSimpleTwoColumns(yPos, 'Date Admitted', dischargeData.dateAdmitted, 'Weight', dischargeData.weight);
  yPos = drawSimpleFullWidth(yPos, 'Date/Time Discharged', dischargeData.dateTimedischarged);
  yPos = drawSimpleFullWidth(yPos, 'Discharge Diagnosis', dischargeData.dischargeDiagnosis);
  yPos += 5;
  
  // VACCINES GIVEN Section
  yPos = drawSimpleHeader('VACCINES GIVEN', yPos);
  
  // Draw vaccine table
  const tableWidth = pageWidth - (margin * 2);
  const rowHeight = 8;
  
  // Define column widths
  const nameCol = tableWidth * 0.45;  // 45% for vaccine name
  const dateCol = tableWidth * 0.20;  // 20% for date
  const timeCol = tableWidth * 0.15;  // 15% for time
  const byCol = tableWidth * 0.20;    // 20% for signature
  
  // Table header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  
  let xPos = margin;
  
  // Draw header cells
  doc.rect(xPos, yPos, nameCol, rowHeight);
  doc.text('Vaccine', xPos + 2, yPos + 5.5);
  xPos += nameCol;
  
  doc.rect(xPos, yPos, dateCol, rowHeight);
  doc.text('Date', xPos + 2, yPos + 5.5);
  xPos += dateCol;
  
  doc.rect(xPos, yPos, timeCol, rowHeight);
  doc.text('Time', xPos + 2, yPos + 5.5);
  xPos += timeCol;
  
  doc.rect(xPos, yPos, byCol, rowHeight);
  doc.text('By', xPos + 2, yPos + 5.5);
  
  yPos += rowHeight;
  
  // Default vaccines if none provided
  const defaultVaccines = [
    { name: 'Hepa B 0.5ml, IM', date: '', time: '', signature: '' },
    { name: 'Vit. K 0.1ml, IM', date: '', time: '', signature: '' },
    { name: 'Erythromycin Eye Ointment, OU', date: '', time: '', signature: '' },
    { name: 'Others', date: '', time: '', signature: '' }
  ];
  
  const vaccinesToDisplay = (dischargeData.vaccines && dischargeData.vaccines.length > 0) 
    ? dischargeData.vaccines 
    : defaultVaccines;
  
  // Draw vaccine rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  vaccinesToDisplay.forEach((vaccine, index) => {
    xPos = margin;
    
    // Draw row cells
    doc.rect(xPos, yPos, nameCol, rowHeight);
    const vaccineName = vaccine.name || '';
    const nameLines = doc.splitTextToSize(vaccineName, nameCol - 4);
    doc.text(nameLines[0] || '', xPos + 2, yPos + 5.5);
    xPos += nameCol;
    
    doc.rect(xPos, yPos, dateCol, rowHeight);
    doc.text(vaccine.date || '', xPos + 2, yPos + 5.5);
    xPos += dateCol;
    
    doc.rect(xPos, yPos, timeCol, rowHeight);
    doc.text(vaccine.time || '', xPos + 2, yPos + 5.5);
    xPos += timeCol;
    
    doc.rect(xPos, yPos, byCol, rowHeight);
    doc.text(vaccine.signature || '', xPos + 2, yPos + 5.5);
    
    yPos += rowHeight;
  });
  
  yPos += 5;
  
  // Special Instructions and Follow-up (without section header)
  yPos = drawTextBox(yPos, 'Special Instructions for Newborn Care', dischargeData.specialInstructions, 30);
  yPos = drawSimpleFullWidth(yPos, 'Follow-up Check-up', dischargeData.followUpCheckUp);
  yPos += 15;
  
  // Signatures (no header) - Only Attending Physician
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const sigWidth = 70; // width of signature line
  const sigY = yPos + 10;
  
  // Attending Physician signature (centered)
  const centerX = (pageWidth - sigWidth) / 2;
  
  doc.text(dischargeData.staffName || '', centerX + (sigWidth / 2), sigY - 2, { align: 'center' });
  doc.line(centerX, sigY, centerX + sigWidth, sigY);
  doc.text('Attending Physician', centerX + (sigWidth / 2), sigY + 5, { align: 'center' });
  
  yPos = sigY + 20;
  
  return doc;
};

export const saveNewbornDischargeAsPDF = async (dischargeData, birthcare_Id, birthCareInfo = null) => {
  try {
    const doc = generateNewbornDischargePDF(dischargeData, birthCareInfo);
    const pdfBlob = doc.output('blob');
    
    // Convert blob to base64
    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });
    
    // Generate title
    const patientName = dischargeData.patientName ? dischargeData.patientName.replace(/\s+/g, '_') : 'Newborn';
    const title = `Newborn_Discharge_${patientName}_${dischargeData.dateTimedischarged?.split('T')[0] || new Date().toISOString().split('T')[0]}`;
    
    return {
      base64PDF,
      title,
      document_type: 'newborn_discharge',
      metadata: {
        patient_name: dischargeData.patientName,
        bed_number: dischargeData.bedNumber,
        case_number: dischargeData.caseNumber,
        date_admitted: dischargeData.dateAdmitted,
        date_discharged: dischargeData.dateTimedischarged,
        discharge_diagnosis: dischargeData.dischargeDiagnosis,
        weight: dischargeData.weight,
        staff_name: dischargeData.staffName,
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Newborn discharge PDF generation failed:', error);
    throw new Error('Failed to generate newborn discharge PDF');
  }
};

export const downloadNewbornDischargePDF = (dischargeData, birthCareInfo = null) => {
  try {
    const doc = generateNewbornDischargePDF(dischargeData, birthCareInfo);
    const patientName = dischargeData.patientName ? dischargeData.patientName.replace(/\s+/g, '_') : 'Newborn';
    const filename = `Newborn_Discharge_${patientName}_${dischargeData.dateTimedischarged?.split('T')[0] || new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Newborn discharge PDF download failed:', error);
    throw new Error('Failed to download newborn discharge PDF');
  }
};

// Newborn Discharge Notes PDF Generator (similar to newborn discharge but for notes form)
export const generateNewbornDischargeNotesPDF = (dischargeData, birthCareInfo = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Set font
  doc.setFont('helvetica');
  
  // Official Header - Republic of the Philippines
  let yPos = 25;
  
  // Republic of the Philippines
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  // City Government of Davao
  doc.setFontSize(13);
  doc.text('CITY GOVERNMENT OF DAVAO', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  // Medical Center Name - use birthcare info or fallback
  const facilityName = birthCareInfo?.name?.toUpperCase() || 'BIRTH CARE FACILITY';
  doc.setFontSize(11);
  doc.text(facilityName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  // Address
  doc.setFontSize(9);
  const address = birthCareInfo?.description || 'Loading facility address...';
  doc.text(address, pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;
  
  // Title border and form name
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(30, yPos, pageWidth - 30, yPos);
  yPos += 8;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('NEWBORN DISCHARGE NOTES', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  doc.line(30, yPos, pageWidth - 30, yPos);
  yPos += 20;
  
  // Patient Information Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name of Patient: ${dischargeData.patientName || 'N/A'}`, 20, yPos);
  yPos += 5;
  doc.text(`Bed Number: ${dischargeData.bedNumber || 'N/A'}`, 20, yPos);
  doc.text(`Case Number: ${dischargeData.caseNumber || 'N/A'}`, 120, yPos);
  yPos += 5;
  doc.text(`Date Admitted: ${dischargeData.dateAdmitted || 'N/A'}`, 20, yPos);
  yPos += 5;
  doc.text(`Date/Time Discharged: ${dischargeData.dateTimedischarged || 'N/A'}`, 20, yPos);
  yPos += 5;
  doc.text(`Discharge Diagnosis: ${dischargeData.dischargeDiagnosis || 'N/A'}`, 20, yPos);
  yPos += 5;
  doc.text(`Weight: ${dischargeData.weight || 'N/A'}`, 20, yPos);
  yPos += 15;
  
  // Vaccines Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Vaccines Given', 20, yPos);
  yPos += 10;
  
  // Vaccines table header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const tableWidth = 170;
  
  // Draw table header
  doc.rect(20, yPos, tableWidth, 8);
  doc.text('Name of Vaccine Given', 22, yPos + 5);
  doc.text('Date', 100, yPos + 5);
  doc.text('Time', 130, yPos + 5);
  doc.text('Signature', 150, yPos + 5);
  yPos += 8;
  
  // Draw vaccine rows
  doc.setFont('helvetica', 'normal');
  if (dischargeData.vaccines && dischargeData.vaccines.length > 0) {
    dischargeData.vaccines.forEach((vaccine, index) => {
      if (vaccine.name || vaccine.date || vaccine.time || vaccine.signature) {
        doc.rect(20, yPos, tableWidth, 6);
        doc.text(vaccine.name || '', 22, yPos + 4);
        doc.text(vaccine.date || '', 100, yPos + 4);
        doc.text(vaccine.time || '', 130, yPos + 4);
        doc.text(vaccine.signature || '', 150, yPos + 4);
        yPos += 6;
      }
    });
  } else {
    doc.rect(20, yPos, tableWidth, 6);
    doc.text('No vaccines administered', 22, yPos + 4);
    yPos += 6;
  }
  yPos += 10;
  
  // Special Instructions Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Special Instructions', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (dischargeData.specialInstructions) {
    const splitInstructions = doc.splitTextToSize(dischargeData.specialInstructions, 170);
    doc.text(splitInstructions, 20, yPos);
    yPos += splitInstructions.length * 5;
  } else {
    doc.text('No special instructions provided', 20, yPos);
    yPos += 5;
  }
  yPos += 10;
  
  // Follow-up Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Follow-up Care', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Follow up check up on: ${dischargeData.followUpCheckUp || 'N/A'}`, 20, yPos);
  yPos += 15;
  
  // Important Note
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTE: PALIHOG DALAHA KINI NGA FORM SA PANAHON SA PAG FOLLOW-UP CHECK-UP.', 20, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Please bring this form during the follow-up check-up appointment.', 20, yPos);
  yPos += 15;
  
  // Signatures Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Signatures', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Staff signature
  doc.text('Staff Giving Instructions:', 20, yPos);
  doc.line(20, yPos + 8, 90, yPos + 8);
  doc.text(dischargeData.staffName || '', 20, yPos + 12);
  
  // Parent/Guardian signature
  doc.text('Parent/Guardian:', 110, yPos);
  doc.line(110, yPos + 8, 180, yPos + 8);
  doc.text(dischargeData.parentGuardianName || '', 110, yPos + 12);
  
  // Footer removed per design request
  return doc;
  return doc;
};

export const saveNewbornDischargeNotesAsPDF = async (dischargeData, birthcare_Id, birthCareInfo = null) => {
  try {
    const doc = generateNewbornDischargeNotesPDF(dischargeData, birthCareInfo);
    const pdfBlob = doc.output('blob');
    
    // Convert blob to base64
    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });
    
    // Generate title
    const patientName = dischargeData.patientName ? dischargeData.patientName.replace(/\s+/g, '_') : 'Newborn';
    const title = `Newborn_Discharge_Notes_${patientName}_${dischargeData.dateTimedischarged?.split('T')[0] || new Date().toISOString().split('T')[0]}`;
    
    return {
      base64PDF,
      title,
      document_type: 'newborn_discharge_notes',
      metadata: {
        patient_name: dischargeData.patientName,
        bed_number: dischargeData.bedNumber,
        case_number: dischargeData.caseNumber,
        date_admitted: dischargeData.dateAdmitted,
        date_discharged: dischargeData.dateTimedischarged,
        discharge_diagnosis: dischargeData.dischargeDiagnosis,
        weight: dischargeData.weight,
        staff_name: dischargeData.staffName,
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Newborn discharge notes PDF generation failed:', error);
    throw new Error('Failed to generate newborn discharge notes PDF');
  }
};

export const downloadNewbornDischargeNotesPDF = (dischargeData, birthCareInfo = null) => {
  try {
    const doc = generateNewbornDischargeNotesPDF(dischargeData, birthCareInfo);
    const patientName = dischargeData.patientName ? dischargeData.patientName.replace(/\s+/g, '_') : 'Newborn';
    const filename = `Newborn_Discharge_Notes_${patientName}_${dischargeData.dateTimedischarged?.split('T')[0] || new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Newborn discharge notes PDF download failed:', error);
    throw new Error('Failed to download newborn discharge notes PDF');
  }
};
