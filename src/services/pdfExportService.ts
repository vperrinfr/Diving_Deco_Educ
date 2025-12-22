import jsPDF from 'jspdf';
import type { DiveProfile, DiveParameters, MultiLevelDiveParameters, DecompressionStop } from '../types';
import type { DiveSite, WeatherConditions } from '../types/diveSite';
import { isMultiLevelDive } from '../types';
import { formatGasMix } from '../utils/gasMix';

interface DiverInfo {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  padiNumber: string;
}

interface ExportData {
  profile: DiveProfile;
  diverInfo?: DiverInfo;
  diveSite?: DiveSite;
  weather?: WeatherConditions;
}

// Format optimisé pour lecture sur bateau : grandes polices, bon contraste
export function generateDivePlanPDF(data: ExportData): void {
  const { profile, diverInfo, diveSite, weather } = data;
  
  // Format A4 portrait pour faciliter la lecture
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Fonction helper pour ajouter du texte avec retour automatique
  const addText = (text: string, size: number, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [0, 0, 0]) => {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', style);
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(text, margin, yPos);
    yPos += size * 0.5; // Espacement proportionnel à la taille
  };

  const addLine = () => {
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
  };

  const addSection = (title: string) => {
    yPos += 5;
    pdf.setFillColor(0, 98, 254); // Bleu IBM
    pdf.rect(margin, yPos - 6, pageWidth - 2 * margin, 10, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(title, margin + 3, yPos);
    yPos += 10;
    pdf.setTextColor(0, 0, 0);
  };

  const checkPageBreak = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
    }
  };

  // ===== EN-TÊTE =====
  pdf.setFillColor(22, 22, 22);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('PLAN DE PLONGÉE', pageWidth / 2, 15, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  pdf.text(currentDate, pageWidth / 2, 25, { align: 'center' });
  
  yPos = 45;

  // ===== INFORMATIONS PLONGEUR =====
  if (diverInfo) {
    addSection('PLONGEUR');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${diverInfo.firstName} ${diverInfo.lastName}`, margin, yPos);
    yPos += 10;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Téléphone: ${diverInfo.phoneNumber}`, margin, yPos);
    yPos += 7;
    pdf.text(`N° PADI: ${diverInfo.padiNumber}`, margin, yPos);
    yPos += 10;
  }

  // ===== SITE DE PLONGÉE =====
  if (diveSite) {
    checkPageBreak(60);
    addSection('SITE DE PLONGÉE');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(diveSite.name, margin, yPos);
    yPos += 10;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    if (diveSite.location.address) {
      pdf.text(`Lieu: ${diveSite.location.address}`, margin, yPos);
      yPos += 7;
    }
    
    pdf.text(`Coordonnées: ${diveSite.location.latitude.toFixed(6)}°, ${diveSite.location.longitude.toFixed(6)}°`, margin, yPos);
    yPos += 7;
    
    pdf.text(`Altitude: ${diveSite.altitude}m`, margin, yPos);
    yPos += 7;
    
    pdf.text(`Température eau: ${diveSite.waterTemperature}°C`, margin, yPos);
    yPos += 7;
    
    if (diveSite.maxDepth) {
      pdf.text(`Profondeur max site: ${diveSite.maxDepth}m`, margin, yPos);
      yPos += 7;
    }
    
    yPos += 3;
  }

  // ===== MÉTÉO =====
  if (weather) {
    checkPageBreak(50);
    addSection('CONDITIONS MÉTÉO');
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    pdf.text(`Température air: ${weather.temperature}°C`, margin, yPos);
    yPos += 7;
    
    pdf.text(`Vent: ${weather.windSpeed} km/h (${weather.windDirection}°)`, margin, yPos);
    yPos += 7;
    
    if (weather.waveHeight) {
      pdf.text(`Hauteur vagues: ${weather.waveHeight}m`, margin, yPos);
      yPos += 7;
    }
    
    pdf.text(`Pression: ${weather.pressure} hPa`, margin, yPos);
    yPos += 7;
    
    pdf.text(`Humidité: ${weather.humidity}%`, margin, yPos);
    yPos += 10;
  }

  // ===== PARAMÈTRES DE PLONGÉE =====
  checkPageBreak(80);
  addSection('PARAMÈTRES DE PLONGÉE');
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  
  // Profondeur max en grand
  pdf.setFontSize(18);
  pdf.setTextColor(0, 98, 254);
  pdf.text(`Profondeur max: ${profile.maxDepth}m`, margin, yPos);
  yPos += 12;
  
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  
  if (!isMultiLevelDive(profile.parameters)) {
    const params = profile.parameters as DiveParameters;
    pdf.text(`Temps fond: ${params.bottomTime} min`, margin, yPos);
    yPos += 9;
    pdf.text(`Mélange: ${formatGasMix(params.gasMix)}`, margin, yPos);
    yPos += 9;
  }
  
  pdf.setFontSize(12);
  pdf.text(`Gradient Factors: ${profile.parameters.gradientFactorLow}/${profile.parameters.gradientFactorHigh}`, margin, yPos);
  yPos += 9;
  
  pdf.text(`Temps total: ${formatTime(profile.totalDiveTime)}`, margin, yPos);
  yPos += 9;
  
  pdf.text(`Temps déco: ${formatTime(profile.totalDecompressionTime)}`, margin, yPos);
  yPos += 12;

  // ===== SEGMENTS (si multi-niveau) =====
  if (profile.segments && profile.segments.length > 0) {
    const bottomSegments = profile.segments.filter(s => s.segmentType === 'bottom');
    if (bottomSegments.length > 0) {
      checkPageBreak(40 + bottomSegments.length * 10);
      addSection('SEGMENTS DE PLONGÉE');
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      
      bottomSegments.forEach((segment, index) => {
        pdf.text(`${index + 1}. ${segment.depth}m - ${segment.duration} min - ${formatGasMix(segment.gasMix)}`, margin + 5, yPos);
        yPos += 8;
      });
      
      yPos += 5;
    }
  }

  // ===== PALIERS DE DÉCOMPRESSION =====
  checkPageBreak(100);
  addSection('PALIERS DE DÉCOMPRESSION');
  
  if (profile.decompressionStops.length === 0) {
    pdf.setFillColor(222, 251, 230);
    pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 20, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(14, 96, 39);
    pdf.text('✓ PLONGÉE SANS PALIER', margin + 5, yPos + 5);
    yPos += 25;
  } else {
    // Tableau des paliers - TRÈS LISIBLE
    const tableTop = yPos;
    const colWidths = [30, 40, 40, 50];
    const rowHeight = 12;
    
    // En-tête du tableau
    pdf.setFillColor(38, 38, 38);
    pdf.rect(margin, tableTop, pageWidth - 2 * margin, rowHeight, 'F');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    
    let xPos = margin + 3;
    pdf.text('Profondeur', xPos, tableTop + 8);
    xPos += colWidths[0]!;
    pdf.text('Durée', xPos, tableTop + 8);
    xPos += colWidths[1]!;
    pdf.text('Runtime', xPos, tableTop + 8);
    xPos += colWidths[2]!;
    pdf.text('Gaz', xPos, tableTop + 8);
    
    yPos = tableTop + rowHeight;
    
    // Lignes du tableau
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13); // Police plus grande pour les paliers
    
    profile.decompressionStops.forEach((stop, index) => {
      checkPageBreak(rowHeight + 10);
      
      // Alternance de couleurs pour meilleure lisibilité
      if (index % 2 === 0) {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'F');
      }
      
      xPos = margin + 3;
      
      // Profondeur en bleu et gras
      pdf.setTextColor(0, 98, 254);
      pdf.text(`${stop.depth}m`, xPos, yPos + 8);
      
      pdf.setTextColor(0, 0, 0);
      xPos += colWidths[0]!;
      pdf.text(formatTime(stop.duration), xPos, yPos + 8);
      
      xPos += colWidths[1]!;
      pdf.text(formatTime(stop.runtime), xPos, yPos + 8);
      
      xPos += colWidths[2]!;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.text(stop.gasMix.name || formatGasMix(stop.gasMix), xPos, yPos + 8);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      
      yPos += rowHeight;
    });
    
    yPos += 10;
  }

  // ===== CHANGEMENTS DE GAZ =====
  if (profile.gasSwitches && profile.gasSwitches.length > 0) {
    checkPageBreak(40 + profile.gasSwitches.length * 10);
    addSection('CHANGEMENTS DE GAZ');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    profile.gasSwitches.forEach((gasSwitch) => {
      pdf.text(`À ${gasSwitch.depth}m: ${formatGasMix(gasSwitch.fromGas)} → ${formatGasMix(gasSwitch.toGas)}`, margin + 5, yPos);
      yPos += 8;
    });
    
    yPos += 5;
  }

  // ===== AVERTISSEMENTS =====
  if (profile.warnings && profile.warnings.length > 0) {
    checkPageBreak(40 + profile.warnings.length * 10);
    addSection('⚠️ AVERTISSEMENTS');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    profile.warnings.forEach((warning) => {
      const color: [number, number, number] = 
        warning.level === 'danger' ? [218, 30, 40] :
        warning.level === 'warning' ? [255, 131, 43] :
        [0, 98, 254];
      
      pdf.setTextColor(color[0], color[1], color[2]);
      pdf.text(`• ${warning.message}`, margin + 5, yPos);
      yPos += 8;
    });
    
    yPos += 5;
  }

  // ===== PIED DE PAGE =====
  const footerY = pageHeight - 20;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Ce plan de plongée est généré automatiquement. Vérifiez toujours avec votre ordinateur de plongée.', pageWidth / 2, footerY, { align: 'center' });
  pdf.text('Ne plongez jamais seul. Respectez vos limites et votre formation.', pageWidth / 2, footerY + 5, { align: 'center' });

  // Générer le nom du fichier
  const fileName = `plan-plongee-${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Télécharger le PDF
  pdf.save(fileName);
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  }
  return `${mins}min`;
}

// Made with Bob