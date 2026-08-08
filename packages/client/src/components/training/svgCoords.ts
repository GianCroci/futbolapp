/**
 * Convert browser client coordinates (clientX/clientY) to SVG viewBox
 * coordinates using the SVG CTM. Correct even when the element letterboxes
 * the drawing (preserveAspectRatio="xMidYMid meet").
 */
export function clientToViewBox(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) {
    // Fallback: assume the drawing fills the element box
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return {
      x: ((clientX - rect.left) / rect.width) * vb.width,
      y: ((clientY - rect.top) / rect.height) * vb.height,
    };
  }
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}
