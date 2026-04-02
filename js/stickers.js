// ============================================
//  Under The Sea — Photo Booth
//  stickers.js  |  sticker editor + download
// ============================================

// ── STRIP CONSTANTS ────────────────────────
const STRIP_W  = 320;
const PHOTO_H  = 220;
const GAP      = 10;
const PADDING  = 16;
const HEADER_H = 48;
const FOOTER_H = 36;

// ── STATE ──────────────────────────────────
let photos         = [];
let placedStickers = [];
let selectedId     = null;
let dragKey        = null;
let stickerCounter = 0;
let dragOffX = 0, dragOffY = 0;

// computed after photos load
let PHOTO_COUNT = 2;
let STRIP_H     = 0;

function computeStripH() {
    STRIP_H = HEADER_H + PADDING + (PHOTO_H * PHOTO_COUNT) + (GAP * (PHOTO_COUNT - 1)) + PADDING + FOOTER_H;
}

const COLORS = {
    topBar1:  "#a8d8f0",
    topBar2:  "#7ec8e3",
    footer1:  "#EDD9A3",
    footer2:  "#F5E6C8",
    photoBg:  "#BEE3FF",
    border:   "rgba(255,255,255,0.7)",
    textDark: "#3A7CA5",
    textLight:"#ffffff",
};

const SLOT_EMOJIS = ["🐠", "🐙", "🐡"];

// ── DOM REFS ───────────────────────────────
const canvas    = document.getElementById("stripCanvas");
const ctx       = canvas.getContext("2d");
const layer     = document.getElementById("stickerLayer");
const container = document.getElementById("canvasContainer");
const sizeSlider= document.getElementById("sizeSlider");

// ── INIT ───────────────────────────────────
function init() {
    const stored = sessionStorage.getItem("boothPhotos");
    photos       = stored ? JSON.parse(stored) : [];
    PHOTO_COUNT  = photos.length || 2;
    computeStripH();

    canvas.width  = STRIP_W;
    canvas.height = STRIP_H;
    fitCanvas();
    drawStrip();
    buildStickerTray();
    setupDropZone();

    document.addEventListener("click", e => {
        if (!e.target.closest(".dropped-sticker")) deselectAll();
    });
}

function fitCanvas() {
    const maxW  = Math.min(window.innerWidth * 0.85, 380);
    const scale = maxW / STRIP_W;
    canvas.style.width  = STRIP_W * scale + "px";
    canvas.style.height = STRIP_H * scale + "px";
}

window.addEventListener("resize", fitCanvas);

// ── BUILD STICKER TRAY ─────────────────────
function buildStickerTray() {
    const tray = document.getElementById("stickerTray");
    const keys = ["clownfish","fish","octopus","shell","shells","wave","coral"];

    keys.forEach(key => {
        const item = document.createElement("div");
        item.className = "sticker-item";
        item.draggable = true;
        item.dataset.sticker = key;
        item.title = key.charAt(0).toUpperCase() + key.slice(1);

        const img = document.createElement("img");
        img.src = STICKERS[key];
        img.alt = key;
        item.appendChild(img);

        item.addEventListener("dragstart", e => {
            dragKey = key;
            e.dataTransfer.effectAllowed = "copy";
            e.dataTransfer.setData("text/plain", key);
        });
        item.addEventListener("touchstart", () => { dragKey = key; }, { passive: true });

        tray.appendChild(item);
    });
}

// ── DRAW STRIP ON CANVAS ───────────────────
function drawStrip() {
    ctx.clearRect(0, 0, STRIP_W, STRIP_H);

    // background
    const bg = ctx.createLinearGradient(0, 0, 0, STRIP_H);
    bg.addColorStop(0, "#c8eaff"); bg.addColorStop(1, "#7ec8e3");
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(0, 0, STRIP_W, STRIP_H, 16); ctx.fill();

    // header
    const hg = ctx.createLinearGradient(0, 0, STRIP_W, 0);
    hg.addColorStop(0, COLORS.topBar1); hg.addColorStop(1, COLORS.topBar2);
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.roundRect(0, 0, STRIP_W, HEADER_H, [16,16,0,0]); ctx.fill();

    ctx.fillStyle = COLORS.textLight;
    ctx.font = 'bold 18px "Baloo 2", cursive';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("✦  UNDER THE SEA  ✦", STRIP_W/2, HEADER_H/2);

    // photo slots — dynamic based on PHOTO_COUNT
    const photoX = PADDING;
    const photoW = STRIP_W - PADDING * 2;

    for (let i = 0; i < PHOTO_COUNT; i++) {
        const y = HEADER_H + PADDING + i * (PHOTO_H + GAP);

        ctx.fillStyle = COLORS.photoBg;
        ctx.beginPath(); ctx.roundRect(photoX, y, photoW, PHOTO_H, 10); ctx.fill();

        if (photos[i]) {
            const img = new Image();
            img.onload = () => {
                ctx.save();
                ctx.beginPath(); ctx.roundRect(photoX, y, photoW, PHOTO_H, 10); ctx.clip();
                ctx.drawImage(img, photoX, y, photoW, PHOTO_H);
                ctx.restore();
            };
            img.src = photos[i];
        } else {
            ctx.fillStyle = "rgba(255,255,255,.5)";
            ctx.font = "36px serif";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(SLOT_EMOJIS[i] || "📸", STRIP_W/2, y + PHOTO_H/2);
        }

        ctx.strokeStyle = COLORS.border; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(photoX, y, photoW, PHOTO_H, 10); ctx.stroke();
    }

    // footer
    const fY = HEADER_H + PADDING + PHOTO_H * PHOTO_COUNT + GAP * (PHOTO_COUNT - 1) + PADDING;
    const fg = ctx.createLinearGradient(0, fY, 0, fY + FOOTER_H);
    fg.addColorStop(0, COLORS.footer1); fg.addColorStop(1, COLORS.footer2);
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.roundRect(0, fY, STRIP_W, FOOTER_H, [0,0,16,16]); ctx.fill();

    ctx.fillStyle = COLORS.textDark;
    ctx.font = '11px "Nunito", sans-serif';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("by nandini  ✦  under the sea", STRIP_W/2, fY + FOOTER_H/2);
}

window.addEventListener("load", () => setTimeout(drawStrip, 300));

// ── DROP ZONE ──────────────────────────────
function setupDropZone() {
    container.addEventListener("dragover", e => {
        e.preventDefault(); e.dataTransfer.dropEffect = "copy";
    });
    container.addEventListener("drop", e => {
        e.preventDefault();
        const rect   = container.getBoundingClientRect();
        const scaleX = STRIP_W / parseFloat(canvas.style.width);
        const scaleY = STRIP_H / parseFloat(canvas.style.height);
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top)  * scaleY;
        const key = e.dataTransfer.getData("text/plain") || dragKey;
        if (key) addSticker(key, x, y);
        dragKey = null;
    });

    container.addEventListener("touchend", e => {
        if (!dragKey) return;
        const touch  = e.changedTouches[0];
        const rect   = container.getBoundingClientRect();
        const scaleX = STRIP_W / parseFloat(canvas.style.width);
        const scaleY = STRIP_H / parseFloat(canvas.style.height);
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top)  * scaleY;
        if (x > 0 && y > 0 && x < STRIP_W && y < STRIP_H) addSticker(dragKey, x, y);
        dragKey = null;
    }, { passive: true });
}

// ── ADD STICKER ────────────────────────────
function addSticker(key, cx, cy) {
    const size     = parseInt(sizeSlider.value);
    const id       = "s" + (stickerCounter++);
    const scaleX   = parseFloat(canvas.style.width)  / STRIP_W;
    const scaleY   = parseFloat(canvas.style.height) / STRIP_H;
    const dispSize = size * scaleX;
    const dispX    = cx * scaleX - dispSize / 2;
    const dispY    = cy * scaleY - dispSize / 2;

    const el = document.createElement("div");
    el.className = "dropped-sticker";
    el.id = id;
    el.style.cssText = `left:${dispX}px;top:${dispY}px;width:${dispSize}px;height:${dispSize}px;`;

    const img = document.createElement("img");
    img.src = STICKERS[key]; img.alt = key;
    el.appendChild(img);

    const del = document.createElement("button");
    del.className = "sticker-del";
    del.textContent = "✕";
    del.style.display = "none";
    del.onclick = e => { e.stopPropagation(); removeSticker(id); };
    el.appendChild(del);

    layer.appendChild(el);

    const data = { id, key, x: cx, y: cy, size, el };
    placedStickers.push(data);

    makeDraggable(el, data);
    el.addEventListener("click", e => { e.stopPropagation(); selectSticker(id); });
}

// ── SELECT / DESELECT ──────────────────────
function selectSticker(id) {
    deselectAll();
    selectedId = id;
    const s = placedStickers.find(s => s.id === id);
    if (!s) return;
    s.el.classList.add("selected");
    s.el.querySelector(".sticker-del").style.display = "flex";
}
function deselectAll() {
    selectedId = null;
    placedStickers.forEach(s => {
        s.el.classList.remove("selected");
        s.el.querySelector(".sticker-del").style.display = "none";
    });
}

// ── DRAG STICKER ON STRIP ──────────────────
function makeDraggable(el, data) {
    el.addEventListener("mousedown", e => {
        e.preventDefault();
        selectSticker(data.id);
        const r = el.getBoundingClientRect();
        dragOffX = e.clientX - r.left;
        dragOffY = e.clientY - r.top;

        const onMove = e => {
            const cr = container.getBoundingClientRect();
            el.style.left = (e.clientX - cr.left - dragOffX) + "px";
            el.style.top  = (e.clientY - cr.top  - dragOffY) + "px";
            const sx = STRIP_W / parseFloat(canvas.style.width);
            const sy = STRIP_H / parseFloat(canvas.style.height);
            data.x = (parseFloat(el.style.left) + parseFloat(el.style.width)/2)  * sx;
            data.y = (parseFloat(el.style.top)  + parseFloat(el.style.height)/2) * sy;
        };
        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    });

    el.addEventListener("touchstart", e => {
        e.stopPropagation();
        selectSticker(data.id);
        const t = e.touches[0];
        const r = el.getBoundingClientRect();
        dragOffX = t.clientX - r.left;
        dragOffY = t.clientY - r.top;
    }, { passive: true });

    el.addEventListener("touchmove", e => {
        e.preventDefault();
        const t  = e.touches[0];
        const cr = container.getBoundingClientRect();
        el.style.left = (t.clientX - cr.left - dragOffX) + "px";
        el.style.top  = (t.clientY - cr.top  - dragOffY) + "px";
        const sx = STRIP_W / parseFloat(canvas.style.width);
        const sy = STRIP_H / parseFloat(canvas.style.height);
        data.x = (parseFloat(el.style.left) + parseFloat(el.style.width)/2)  * sx;
        data.y = (parseFloat(el.style.top)  + parseFloat(el.style.height)/2) * sy;
    }, { passive: false });
}

// ── REMOVE / CLEAR / UNDO ──────────────────
function removeSticker(id) {
    const idx = placedStickers.findIndex(s => s.id === id);
    if (idx === -1) return;
    placedStickers[idx].el.remove();
    placedStickers.splice(idx, 1);
    selectedId = null;
}
function clearStickers() {
    placedStickers.forEach(s => s.el.remove());
    placedStickers = []; selectedId = null;
}
function undoLast() {
    if (!placedStickers.length) return;
    placedStickers.pop().el.remove();
    selectedId = null;
}

// ── DOWNLOAD ───────────────────────────────
async function downloadStrip() {
    deselectAll();

    const exp  = document.createElement("canvas");
    exp.width  = STRIP_W * 2;
    exp.height = STRIP_H * 2;
    const ec   = exp.getContext("2d");
    ec.scale(2, 2);

    // background
    const bg = ec.createLinearGradient(0, 0, 0, STRIP_H);
    bg.addColorStop(0, "#c8eaff"); bg.addColorStop(1, "#7ec8e3");
    ec.fillStyle = bg;
    ec.beginPath(); ec.roundRect(0, 0, STRIP_W, STRIP_H, 16); ec.fill();

    // header
    const hg = ec.createLinearGradient(0, 0, STRIP_W, 0);
    hg.addColorStop(0, COLORS.topBar1); hg.addColorStop(1, COLORS.topBar2);
    ec.fillStyle = hg;
    ec.beginPath(); ec.roundRect(0, 0, STRIP_W, HEADER_H, [16,16,0,0]); ec.fill();
    ec.fillStyle = COLORS.textLight;
    ec.font = "bold 18px sans-serif";
    ec.textAlign = "center"; ec.textBaseline = "middle";
    ec.fillText("✦  UNDER THE SEA  ✦", STRIP_W/2, HEADER_H/2);

    // photo slots — dynamic
    const photoX = PADDING;
    const photoW = STRIP_W - PADDING * 2;

    for (let i = 0; i < PHOTO_COUNT; i++) {
        const y = HEADER_H + PADDING + i * (PHOTO_H + GAP);

        if (photos[i]) {
            await new Promise(res => {
                const img = new Image();
                img.onload = () => {
                    ec.save();
                    ec.beginPath(); ec.roundRect(photoX, y, photoW, PHOTO_H, 10); ec.clip();
                    ec.drawImage(img, photoX, y, photoW, PHOTO_H);
                    ec.restore(); res();
                };
                img.src = photos[i];
            });
        } else {
            ec.fillStyle = COLORS.photoBg;
            ec.beginPath(); ec.roundRect(photoX, y, photoW, PHOTO_H, 10); ec.fill();
            ec.fillStyle = "rgba(255,255,255,.5)";
            ec.font = "36px serif";
            ec.textAlign = "center"; ec.textBaseline = "middle";
            ec.fillText(SLOT_EMOJIS[i] || "📸", STRIP_W/2, y + PHOTO_H/2);
        }

        ec.strokeStyle = COLORS.border; ec.lineWidth = 2;
        ec.beginPath(); ec.roundRect(photoX, y, photoW, PHOTO_H, 10); ec.stroke();
    }

    // footer
    const fY = HEADER_H + PADDING + PHOTO_H * PHOTO_COUNT + GAP * (PHOTO_COUNT - 1) + PADDING;
    const fg = ec.createLinearGradient(0, fY, 0, fY + FOOTER_H);
    fg.addColorStop(0, COLORS.footer1); fg.addColorStop(1, COLORS.footer2);
    ec.fillStyle = fg;
    ec.beginPath(); ec.roundRect(0, fY, STRIP_W, FOOTER_H, [0,0,16,16]); ec.fill();
    ec.fillStyle = COLORS.textDark;
    ec.font = "11px sans-serif";
    ec.textAlign = "center"; ec.textBaseline = "middle";
    ec.fillText("by nandini  ✦  under the sea", STRIP_W/2, fY + FOOTER_H/2);

    // composite stickers
    for (const s of placedStickers) {
        await new Promise(res => {
            const img = new Image();
            img.onload = () => {
                ec.drawImage(img, s.x - s.size/2, s.y - s.size/2, s.size, s.size);
                res();
            };
            img.src = STICKERS[s.key];
        });
    }

    // flash + save
    const fl = document.getElementById("dlFlash");
    fl.classList.add("active");
    setTimeout(() => fl.classList.remove("active"), 200);

    const a = document.createElement("a");
    a.download = "under-the-sea-strip.png";
    a.href = exp.toDataURL("image/png");
    a.click();
}

// KICK OFF
document.addEventListener("DOMContentLoaded", init);