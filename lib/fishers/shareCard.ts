// A picture of the result (score plus verse) to post on WhatsApp or Instagram.

export type ShareCardInput = {
  title: string;
  headline: string;
  score: string;
  unit: string;
  verse: string;
  ref: string;
};

const W = 1080;
const H = 1350;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function fish(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, a: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.bezierCurveTo(-6, -5.5, 4, -5.5, 9, 0);
  ctx.bezierCurveTo(4, 5.5, -6, 5.5, -9, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(-15, -4.5);
  ctx.lineTo(-13.5, 0);
  ctx.lineTo(-15, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export async function makeShareCard(input: ShareCardInput): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  try {
    await document.fonts?.ready;
  } catch {
    /* fonts API missing */
  }
  const font = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#02130f");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // a school of fish drifting across the top
  const turq = "rgb(0, 201, 177)";
  [
    [160, 190, 3.2, -0.15, turq],
    [260, 235, 2.2, -0.1, "rgba(255,255,255,0.35)"],
    [235, 150, 2, -0.2, "rgba(255,255,255,0.25)"],
    [340, 200, 1.8, -0.08, "rgba(255,255,255,0.3)"],
    [900, 260, 2.6, Math.PI + 0.1, "rgba(255,255,255,0.18)"],
    [820, 300, 1.9, Math.PI + 0.2, "rgba(0,201,177,0.5)"],
  ].forEach(([x, y, s, a, c]) => fish(ctx, x as number, y as number, s as number, a as number, c as string));

  ctx.textAlign = "center";
  ctx.fillStyle = turq;
  ctx.font = `600 34px ${font}`;
  ctx.fillText(input.title.toUpperCase().split("").join(" "), W / 2, 420);

  ctx.fillStyle = "#fff";
  ctx.font = `700 190px ${font}`;
  ctx.fillText(input.score, W / 2, 610);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `500 40px ${font}`;
  ctx.fillText(input.unit, W / 2, 670);

  ctx.fillStyle = "#fff";
  ctx.font = `600 52px ${font}`;
  wrap(ctx, input.headline, 800).forEach((l, i) => ctx.fillText(l, W / 2, 770 + i * 64));

  // verse card
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.strokeStyle = "rgba(0,201,177,0.45)";
  ctx.lineWidth = 2;
  const cardY = 880;
  ctx.font = `italic 400 40px ${font}`;
  const lines = wrap(ctx, `“${input.verse}”`, 820);
  const cardH = 120 + lines.length * 56;
  ctx.beginPath();
  ctx.roundRect(100, cardY, W - 200, cardH, 36);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  lines.forEach((l, i) => ctx.fillText(l, W / 2, cardY + 78 + i * 56));
  ctx.fillStyle = turq;
  ctx.font = `600 36px ${font}`;
  ctx.fillText(`${input.ref} (KJV)`, W / 2, cardY + cardH - 34);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `600 38px ${font}`;
  ctx.fillText("Evergreen City Community", W / 2, H - 120);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `400 30px ${font}`;
  ctx.fillText("Kazhakootam, Trivandrum · Sundays 10:30 AM", W / 2, H - 70);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

/** Share the card through the phone's share sheet, or download it on desktop. */
export async function shareCard(blob: Blob, text: string, url: string): Promise<"shared" | "downloaded" | "copied" | "failed"> {
  const file = new File([blob], "fishers-of-men.png", { type: "image/png" });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text, url });
      return "shared";
    }
  } catch (e) {
    if ((e as DOMException)?.name === "AbortError") return "failed";
  }
  try {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "fishers-of-men.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return "downloaded";
  } catch {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      return "copied";
    } catch {
      return "failed";
    }
  }
}
