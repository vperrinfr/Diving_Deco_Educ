import jsPDF from 'jspdf';
import type { DiveProfile, DiveParameters, MultiLevelDiveParameters, DecompressionStop } from '../types';
import type { DiveSite, WeatherConditions } from '../types/diveSite';
import type { AirConsumptionResult, CylinderConfig } from '../types/airConsumption';
import { STANDARD_CYLINDERS } from '../types/airConsumption';
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
  airConsumption?: AirConsumptionResult;
}

// Format optimisé pour lecture sur bateau : grandes polices, bon contraste, max 2 pages
export function generateDivePlanPDF(data: ExportData): void {
  const { profile, diverInfo, diveSite, weather, airConsumption } = data;
  
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

  // ===== EN-TÊTE COMPACT =====
  pdf.setFillColor(22, 22, 22);
  pdf.rect(0, 0, pageWidth, 28, 'F');
  
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('PLAN DE PLONGÉE', pageWidth / 2, 12, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  pdf.text(currentDate, pageWidth / 2, 20, { align: 'center' });
  
  yPos = 35;

  // ===== INFORMATIONS PLONGEUR (COMPACT) =====
  if (diverInfo) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${diverInfo.firstName} ${diverInfo.lastName}`, margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Tel: ${diverInfo.phoneNumber} | PADI: ${diverInfo.padiNumber}`, margin, yPos + 5);
    yPos += 12;
  }

  // ===== SITE DE PLONGÉE =====
  if (diveSite) {
    addSection('SITE DE PLONGÉE');
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(diveSite.name, margin, yPos);
    yPos += 7;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    if (diveSite.location.address) {
      pdf.text(`📍 ${diveSite.location.address}`, margin, yPos);
      yPos += 5;
    }
    
    pdf.text(`Coordonnées: ${diveSite.location.latitude.toFixed(4)}°, ${diveSite.location.longitude.toFixed(4)}°`, margin, yPos);
    yPos += 5;
    
    const siteInfo = `Altitude: ${diveSite.altitude}m | Eau: ${diveSite.waterTemperature}°C`;
    pdf.text(siteInfo, margin, yPos);
    yPos += 5;
    
    if (diveSite.maxDepth) {
      pdf.text(`Profondeur max du site: ${diveSite.maxDepth}m`, margin, yPos);
      yPos += 5;
    }
    
    yPos += 3;
  }
  
  // ===== MÉTÉO =====
  if (weather) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Météo:', margin, yPos);
    pdf.setFont('helvetica', 'normal');
    const weatherInfo = `Air: ${weather.temperature}°C | Vent: ${weather.windSpeed}km/h (${weather.windDirection}°) | Pression: ${weather.pressure}hPa`;
    pdf.text(weatherInfo, margin + 20, yPos);
    yPos += 8;
  }

  // ===== PARAMÈTRES DE PLONGÉE (COMPACT) =====
  addSection('PARAMÈTRES');
  
  // Ligne 1: Profondeur et temps
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 98, 254);
  pdf.text(`${profile.maxDepth}m`, margin, yPos);
  
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`| Total: ${formatTime(profile.totalDiveTime)} | Déco: ${formatTime(profile.totalDecompressionTime)}`, margin + 25, yPos);
  yPos += 8;
  
  // Ligne 2: Gaz et GF
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  if (!isMultiLevelDive(profile.parameters)) {
    const params = profile.parameters as DiveParameters;
    pdf.text(`Gaz: ${formatGasMix(params.gasMix)} | Temps fond: ${params.bottomTime}min | GF: ${profile.parameters.gradientFactorLow}/${profile.parameters.gradientFactorHigh}`, margin, yPos);
  } else {
    pdf.text(`GF: ${profile.parameters.gradientFactorLow}/${profile.parameters.gradientFactorHigh}`, margin, yPos);
  }
  yPos += 10;

  // ===== SEGMENTS (COMPACT) =====
  if (profile.segments && profile.segments.length > 0) {
    const bottomSegments = profile.segments.filter(s => s.segmentType === 'bottom');
    if (bottomSegments.length > 0) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Segments:', margin, yPos);
      yPos += 5;
      
      pdf.setFont('helvetica', 'normal');
      bottomSegments.forEach((segment, index) => {
        pdf.text(`${index + 1}. ${segment.depth}m/${segment.duration}min (${formatGasMix(segment.gasMix)})`, margin + 5, yPos);
        yPos += 5;
      });
      yPos += 3;
    }
  }

  // ===== PALIERS DE DÉCOMPRESSION (COMPACT) =====
  addSection('PALIERS');
  
  if (profile.decompressionStops.length === 0) {
    pdf.setFillColor(222, 251, 230);
    pdf.rect(margin, yPos - 3, pageWidth - 2 * margin, 12, 'F');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(14, 96, 39);
    pdf.text('✓ SANS PALIER', margin + 3, yPos + 4);
    yPos += 15;
  } else {
    // Tableau compact
    const tableTop = yPos;
    const colWidths = [25, 30, 30, 45];
    const rowHeight = 9;
    
    // En-tête
    pdf.setFillColor(38, 38, 38);
    pdf.rect(margin, tableTop, pageWidth - 2 * margin, rowHeight, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    
    let xPos = margin + 2;
    pdf.text('Prof.', xPos, tableTop + 6);
    xPos += colWidths[0]!;
    pdf.text('Durée', xPos, tableTop + 6);
    xPos += colWidths[1]!;
    pdf.text('Runtime', xPos, tableTop + 6);
    xPos += colWidths[2]!;
    pdf.text('Gaz', xPos, tableTop + 6);
    
    yPos = tableTop + rowHeight;
    
    // Lignes
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    
    profile.decompressionStops.forEach((stop, index) => {
      if (index % 2 === 0) {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'F');
      }
      
      xPos = margin + 2;
      pdf.setTextColor(0, 98, 254);
      pdf.text(`${stop.depth}m`, xPos, yPos + 6);
      
      pdf.setTextColor(0, 0, 0);
      xPos += colWidths[0]!;
      pdf.text(formatTime(stop.duration), xPos, yPos + 6);
      
      xPos += colWidths[1]!;
      pdf.text(formatTime(stop.runtime), xPos, yPos + 6);
      
      xPos += colWidths[2]!;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(stop.gasMix.name || formatGasMix(stop.gasMix), xPos, yPos + 6);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      
      yPos += rowHeight;
    });
    
    yPos += 8;
  }

  // ===== BOUTEILLES & CONSOMMATION D'AIR =====
  if (airConsumption) {
    addSection('BOUTEILLES & CONSOMMATION');
    
    // Résumé
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    const statusColor: [number, number, number] = airConsumption.isSufficient ? [36, 161, 72] : [218, 30, 40];
    pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.text(`${airConsumption.isSufficient ? '✓' : '⚠'} Air nécessaire: ${airConsumption.totalAirNeeded.toFixed(0)}L`, margin, yPos);
    yPos += 7;
    
    // Bouteilles
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    airConsumption.cylinderUsage.forEach((usage) => {
      const cylinder = STANDARD_CYLINDERS.find(c => c.id === usage.cylinderId);
      const usageColor: [number, number, number] = usage.percentageUsed > 80 ? [218, 30, 40] : [0, 0, 0];
      
      pdf.setTextColor(usageColor[0], usageColor[1], usageColor[2]);
      pdf.text(`• ${cylinder?.name || usage.cylinderId}: ${usage.startPressure}→${usage.endPressure.toFixed(0)}bar (${usage.percentageUsed.toFixed(0)}%)`, margin + 3, yPos);
      yPos += 5;
    });
    
    pdf.setTextColor(0, 0, 0);
    yPos += 5;
  }

  // ===== CHANGEMENTS DE GAZ (COMPACT) =====
  if (profile.gasSwitches && profile.gasSwitches.length > 0) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Changements gaz:', margin, yPos);
    yPos += 5;
    
    pdf.setFont('helvetica', 'normal');
    profile.gasSwitches.forEach((gasSwitch) => {
      pdf.text(`${gasSwitch.depth}m: ${formatGasMix(gasSwitch.fromGas)} → ${formatGasMix(gasSwitch.toGas)}`, margin + 3, yPos);
      yPos += 5;
    });
    yPos += 3;
  }

  // ===== AVERTISSEMENTS (COMPACT) =====
  if (profile.warnings && profile.warnings.length > 0) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('⚠️ Avertissements:', margin, yPos);
    yPos += 5;
    
    pdf.setFont('helvetica', 'normal');
    profile.warnings.forEach((warning) => {
      const color: [number, number, number] =
        warning.level === 'danger' ? [218, 30, 40] :
        warning.level === 'warning' ? [255, 131, 43] :
        [0, 98, 254];
      
      pdf.setTextColor(color[0], color[1], color[2]);
      pdf.text(`• ${warning.message}`, margin + 3, yPos);
      yPos += 5;
    });
    pdf.setTextColor(0, 0, 0);
  }

  // ===== PIED DE PAGE (COMPACT) =====
  const footerY = pageHeight - 15;
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Plan généré automatiquement. Vérifiez avec votre ordinateur. Ne plongez jamais seul.', pageWidth / 2, footerY, { align: 'center' });

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