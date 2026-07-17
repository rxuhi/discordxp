const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const MAIN_COLOR = '#a7b7d6';
const BG_COLOR = '#1e1f22';
const SUB_COLOR = '#2b2d31';

// 한글이 깨지지 않으려면 fonts 폴더에 한글을 지원하는 ttf 폰트가 필요합니다.
// (예: 나눔고딕 - NanumGothic.ttf, NanumGothicBold.ttf)
let FONT_FAMILY = 'sans-serif';
let FONT_FAMILY_BOLD = 'sans-serif';
try {
  const fontPath = path.join(__dirname, '유한킴벌리_푸른숲체 Bold.ttf');

if (fs.existsSync(fontPath)) {
    GlobalFonts.registerFromPath(fontPath, 'Yuhan');
    FONT_FAMILY = 'Yuhan';
    FONT_FAMILY_BOLD = 'Yuhan';
}
} catch (e) {
  console.warn('[card.js] 폰트 로드 실패, 기본 폰트로 대체합니다.', e.message);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function generateProfileCard({ avatarURL, displayName, tag, xp, gambleXp, rank }) {
  const width = 900;
  const height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 배경
  ctx.fillStyle = BG_COLOR;
  roundRect(ctx, 0, 0, width, height, 28);
  ctx.fill();

  // 왼쪽 포인트 컬러 바
  ctx.save();
  roundRect(ctx, 0, 0, width, height, 28);
  ctx.clip();
  ctx.fillStyle = MAIN_COLOR;
  ctx.fillRect(0, 0, 18, height);
  ctx.restore();

  // 안쪽 카드 (여백)
  ctx.fillStyle = SUB_COLOR;
  roundRect(ctx, 18, 18, width - 36, height - 36, 20);
  ctx.fill();

  // 아바타
  const avatarSize = 190;
  const avatarX = 55;
  const avatarY = (height - avatarSize) / 2;

  try {
    const avatar = await loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
  } catch (e) {
    console.warn('[card.js] 아바타 로드 실패', e.message);
  }

  ctx.strokeStyle = MAIN_COLOR;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.stroke();

  // 랭크 뱃지 (아바타 우하단)
  const badgeR = 34;
  const badgeX = avatarX + avatarSize - 10;
  const badgeY = avatarY + avatarSize - 10;
  ctx.fillStyle = MAIN_COLOR;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BG_COLOR;
  ctx.font = `bold 22px ${FONT_FAMILY_BOLD}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`#${rank}`, badgeX, badgeY + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // 텍스트 영역
  const textX = avatarX + avatarSize + 55;

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 42px ${FONT_FAMILY_BOLD}`;
  ctx.fillText(displayName, textX, 95);

  if (tag) {
    ctx.fillStyle = '#9aa2ad';
    ctx.font = `20px ${FONT_FAMILY}`;
    ctx.fillText(tag, textX, 122);
  }

  // 구분선
  ctx.strokeStyle = 'rgba(167,183,214,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(textX, 142);
  ctx.lineTo(width - 55, 142);
  ctx.stroke();

  // 스탯
  const statY1 = 185;
  const statY2 = 230;

  ctx.fillStyle = MAIN_COLOR;
  ctx.font = `bold 24px ${FONT_FAMILY_BOLD}`;
  ctx.fillText('경험치', textX, statY1);
  ctx.fillText('도박 경험치', textX, statY2);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 24px ${FONT_FAMILY_BOLD}`;
  ctx.textAlign = 'right';
  ctx.fillText(xp.toLocaleString() + ' XP', width - 55, statY1);
  ctx.fillText(gambleXp.toLocaleString() + ' XP', width - 55, statY2);
  ctx.textAlign = 'left';

  return canvas.toBuffer('image/png');
}

module.exports = { generateProfileCard };
