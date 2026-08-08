import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Formation, MatchEvent, MatchEventType, Substitution } from '../types';

const EVENT_LABELS: Record<MatchEventType, string> = {
  GOAL: 'Gol',
  ASSIST: 'Asistencia',
  YELLOW_CARD: 'Tarjeta amarilla',
  RED_CARD: 'Tarjeta roja',
  SUB_IN: 'Ingreso',
  SUB_OUT: 'Salida',
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Sin fecha';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function exportFormationPdf(
  formation: Formation & { players: Array<{ playerId: string; slotPosition: string; positionX: number; positionY: number; rating?: number | null; isSubstitute?: boolean; subInMinute?: number | null; subOutMinute?: number | null; player?: { name: string; dorsal: number | null } }> },
  events: MatchEvent[],
  substitutions: Substitution[],
  playerNames: Record<string, string>,
  pitchElement: HTMLElement | null,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // --- Header ---
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(formation.name, margin, y + 6);
  y += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(formatDateTime(formation.date), margin, y + 4);
  y += 8;

  // Match metadata line
  const metaParts: string[] = [];
  if (formation.opponent) metaParts.push(`vs ${formation.opponent}`);
  if (formation.scoreHome != null && formation.scoreAway != null) {
    metaParts.push(`${formation.scoreHome} - ${formation.scoreAway}`);
  }
  if (formation.matchDate) metaParts.push(formatDate(formation.matchDate));
  if (formation.formationType) {
    const labels: Record<string, string> = {
      F_4_4_2: '4-4-2', F_4_3_3: '4-3-3', F_3_5_2: '3-5-2',
      F_4_2_3_1: '4-2-3-1', F_5_3_2: '5-3-2', F_4_1_4_1: '4-1-4-1', F_3_4_3: '3-4-3',
    };
    metaParts.unshift(labels[formation.formationType] || formation.formationType);
  }
  if (metaParts.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(metaParts.join('  |  '), margin, y + 4);
    y += 8;
  }

  y += 4;

  // --- Pitch image ---
  if (pitchElement) {
    try {
      const canvas = await html2canvas(pitchElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const imgAspect = canvas.width / canvas.height;
      const imgWidth = Math.min(contentWidth, 120);
      const imgHeight = imgWidth / imgAspect;
      const imgX = (pageWidth - imgWidth) / 2;
      doc.addImage(imgData, 'PNG', imgX, y, imgWidth, imgHeight);
      y += imgHeight + 8;
    } catch {
      // Skip pitch image if capture fails
    }
  }

  // --- Check if we need a new page ---
  const checkNewPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // --- Titulares ---
  const starters = formation.players.filter((p) => !p.isSubstitute);
  if (starters.length > 0) {
    checkNewPage(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Titulares', margin, y + 4);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    for (const fp of starters) {
      checkNewPage(6);
      const name = playerNames[fp.playerId] ?? fp.playerId;
      const dorsal = fp.player?.dorsal;
      const rating = fp.rating;
      const label = `${dorsal ? '#' + dorsal : '-'}  ${name}`;
      doc.setTextColor(40, 40, 40);
      doc.text(label, margin + 2, y + 3);

      if (rating != null) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 120, 0);
        doc.text(`${rating}`, margin + contentWidth - 10, y + 3);
        doc.setFont('helvetica', 'normal');
      }

      doc.setTextColor(120, 120, 120);
      doc.text(fp.slotPosition, margin + 60, y + 3);
      y += 5;
    }
    y += 4;
  }

  // --- Suplentes ---
  const subs = formation.players.filter((p) => p.isSubstitute);
  if (subs.length > 0) {
    checkNewPage(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Suplentes', margin, y + 4);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    for (const fp of subs) {
      checkNewPage(6);
      const name = playerNames[fp.playerId] ?? fp.playerId;
      const dorsal = fp.player?.dorsal;
      const rating = fp.rating;
      const minuteInfo = fp.subInMinute != null ? ` (entra min ${fp.subInMinute})` : '';
      const label = `${dorsal ? '#' + dorsal : '-'}  ${name}${minuteInfo}`;
      doc.setTextColor(40, 40, 40);
      doc.text(label, margin + 2, y + 3);

      if (rating != null) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 120, 0);
        doc.text(`${rating}`, margin + contentWidth - 10, y + 3);
        doc.setFont('helvetica', 'normal');
      }
      y += 5;
    }
    y += 4;
  }

  // --- Sustituciones ---
  if (substitutions.length > 0) {
    checkNewPage(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Sustituciones', margin, y + 4);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    for (const sub of substitutions) {
      checkNewPage(6);
      const outName = playerNames[sub.playerOutId] ?? sub.playerOutId;
      const inName = playerNames[sub.playerInId] ?? sub.playerInId;
      doc.setTextColor(40, 40, 40);
      doc.text(`Min ${sub.minute}: ${outName} sale -> ${inName} entra`, margin + 2, y + 3);
      y += 5;
    }
    y += 4;
  }

  // --- Eventos ---
  const sortedEvents = [...events].sort((a, b) => (a.minute ?? Infinity) - (b.minute ?? Infinity));
  if (sortedEvents.length > 0) {
    checkNewPage(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Eventos del partido', margin, y + 4);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    for (const event of sortedEvents) {
      checkNewPage(6);
      const name = playerNames[event.playerId] ?? event.playerId;
      const label = EVENT_LABELS[event.eventType] || event.eventType;
      const minuteStr = event.minute != null ? `${event.minute}'` : '';
      doc.setTextColor(40, 40, 40);
      doc.text(`${minuteStr}  ${name} - ${label}`, margin + 2, y + 3);
      y += 5;
    }
    y += 4;
  }

  // --- Análisis del DT ---
  if (formation.comments) {
    checkNewPage(30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('Análisis del DT', margin, y + 4);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(formation.comments, contentWidth - 4);
    for (const line of lines) {
      checkNewPage(5);
      doc.text(line, margin + 2, y + 3);
      y += 4.5;
    }
    y += 4;
  }

  // --- Footer ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `FutbolApp  |  Pagina ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' },
    );
  }

  // Save
  const fileName = `formacion-${(formation.name || 'sin-nombre').replace(/\s+/g, '-').toLowerCase()}.pdf`;
  doc.save(fileName);
}
