import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Downloads the event pass as a PDF file.
 * Captures the pass element (styled pass + QR code) as an image, then
 * embeds it into a single-page PDF and triggers a browser download.
 *
 * Concepts used: DOM capture (html2canvas), PDF generation (jspdf),
 * file download.
 *
 * @param {HTMLElement} passElement - the rendered pass DOM element
 * @param {string} filename - name for the downloaded file
 */
export function downloadPassAsPdf(passElement, filename = 'event-pass.pdf') {
  if (!passElement) {
    return;
  }

  // Capture the styled pass as a PNG image (includes SVG QR code).
  html2canvas(passElement, {
    scale: 2,           // higher resolution for print quality
    useCORS: true,
    logging: false,
    removeContainer: true,
  }).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');
    const imgProps = { width: canvas.width, height: canvas.height };
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  });
}
