// ============================================
//  Under The Sea — Photo Booth
//  booth.js  |  camera + capture logic
// ============================================

const params      = new URLSearchParams(window.location.search);
const TOTAL_PHOTOS = parseInt(params.get("photos")) || 2;
const IS_UPLOAD    = params.get("upload") === "true";

let photos    = Array(TOTAL_PHOTOS).fill(null);
let stream    = null;
let capturing = false;

const SLOT_EMOJIS = ["🐠", "🐙", "🐡"];

// ── DOM REFS ───────────────────────────────
const video            = document.getElementById("video");
const canvas           = document.getElementById("canvas");
const captureBtn       = document.getElementById("captureBtn");
const statusMsg        = document.getElementById("statusMsg");
const nextBtn          = document.getElementById("nextBtn");
const countdownOverlay = document.getElementById("countdownOverlay");
const countdownNum     = document.getElementById("countdownNum");
const flash            = document.getElementById("flash");
const permScreen       = document.getElementById("permScreen");

// ── BUILD DYNAMIC SLOTS ────────────────────
function buildStripSlots() {
    const stripInner = document.getElementById("stripInner");
    stripInner.innerHTML = "";
    for (let i = 0; i < TOTAL_PHOTOS; i++) {
        const div = document.createElement("div");
        div.className = "strip-slot";
        div.id = "slot" + i;
        div.textContent = SLOT_EMOJIS[i] || "📸";
        stripInner.appendChild(div);
    }
}

function buildUploadSlots() {
    const container = document.getElementById("uploadSlots");
    const subtitle  = document.getElementById("uploadSubtitle");
    subtitle.textContent = `Choose ${TOTAL_PHOTOS} photos from your device`;
    container.innerHTML  = "";

    for (let i = 0; i < TOTAL_PHOTOS; i++) {
        container.innerHTML += `
        <div class="upload-slot">
            <div id="uploadPreview${i}"></div>
            <div class="upload-slot-label">
                <span>${SLOT_EMOJIS[i] || "📸"}</span>
                <span>Photo ${i + 1} — Click to upload</span>
            </div>
            <input type="file" accept="image/*" onchange="handleFileSelect(this, ${i})"/>
        </div>`;
    }
}

// ── STICKER DECORATIONS ────────────────────
function injectStripDecos() {
    const decoEl = document.querySelector(".strip-bottom-deco");
    if (!decoEl) return;
    ["shell", "wave", "shell"].forEach(key => {
        const img = document.createElement("img");
        img.src = STICKERS[key]; img.alt = key;
        decoEl.appendChild(img);
    });
    [
        { key:"shell", top:"58px", left:"8px",  dur:4,  delay:0  },
        { key:"shell", top:"58px", right:"8px", dur:5,  delay:.8 },
    ].forEach(cfg => {
        const img = document.createElement("img");
        img.className = "frame-deco";
        img.src = STICKERS[cfg.key]; img.alt = cfg.key;
        img.style.cssText = `width:32px;top:${cfg.top};${cfg.left?"left:"+cfg.left:"right:"+cfg.right};animation-duration:${cfg.dur}s;animation-delay:${cfg.delay}s;`;
        document.getElementById("cameraFrame").appendChild(img);
    });
}

// ── CAMERA ─────────────────────────────────
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;
        permScreen.style.display = "none";
        statusMsg.textContent = `🐠 Click capture to start your ${TOTAL_PHOTOS}-photo strip!`;
    } catch (e) {
        alert("Camera access denied. Please allow camera access and reload.");
    }
}

// ── CAPTURE FLOW ────────────────────────────
async function startCapture() {
    if (capturing) return;
    capturing = true;
    captureBtn.disabled = true;
    photos = Array(TOTAL_PHOTOS).fill(null);

    for (let i = 0; i < TOTAL_PHOTOS; i++) {
        statusMsg.textContent = `📷 Get ready for photo ${i + 1} of ${TOTAL_PHOTOS}!`;
        await countdown(3);

        triggerFlash();
        const dataUrl = captureFrame();
        photos[i] = dataUrl;

        const slot = document.getElementById("slot" + i);
        slot.innerHTML = `<img src="${dataUrl}" alt="photo ${i + 1}"/>`;

        statusMsg.textContent = i < TOTAL_PHOTOS - 1
            ? `Photo ${i + 1} captured! Get ready for the next one...`
            : `🎉 All photos captured!`;

        if (i < TOTAL_PHOTOS - 1) await wait(1200);
    }

    statusMsg.textContent = "🎉 Your strip is ready! Add some stickers?";
    captureBtn.disabled = false;
    capturing = false;
    sessionStorage.setItem("boothPhotos", JSON.stringify(photos));
    nextBtn.classList.add("visible");
}

// ── HELPERS ────────────────────────────────
function countdown(from) {
    return new Promise(resolve => {
        let n = from;
        countdownNum.textContent = n;
        countdownOverlay.classList.add("active");
        resetAnim(countdownNum);
        const interval = setInterval(() => {
            n--;
            if (n <= 0) {
                clearInterval(interval);
                countdownOverlay.classList.remove("active");
                resolve();
            } else {
                countdownNum.textContent = n;
                resetAnim(countdownNum);
            }
        }, 1000);
    });
}

function resetAnim(el) {
    el.style.animation = "none";
    el.offsetHeight;
    el.style.animation = "";
}

function triggerFlash() {
    flash.classList.add("active");
    setTimeout(() => flash.classList.remove("active"), 150);
}

function captureFrame() {
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function goToStickers() { window.location.href = "stickers.html"; }

// ── UPLOAD MODE ─────────────────────────────
function initUploadMode() {
    permScreen.style.display = "none";
    document.getElementById("cameraFrame").style.display = "none";
    captureBtn.style.display = "none";
    statusMsg.style.display  = "none";
    document.getElementById("uploadScreen").style.display = "flex";
    document.querySelector(".strip-section").style.display = "flex";
}

function handleFileSelect(input, slotIndex) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const dataUrl = e.target.result;
        photos[slotIndex] = dataUrl;

        const preview = document.getElementById("uploadPreview" + slotIndex);
        preview.innerHTML = `<img src="${dataUrl}" alt="photo ${slotIndex + 1}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;"/>`;

        const slot = document.getElementById("slot" + slotIndex);
        slot.innerHTML = `<img src="${dataUrl}" alt="photo ${slotIndex + 1}"/>`;

        updateUploadStatus();
    };
    reader.readAsDataURL(file);
}

function updateUploadStatus() {
    const filled    = photos.filter(Boolean).length;
    const statusEl  = document.getElementById("uploadStatus");
    const remaining = TOTAL_PHOTOS - filled;

    if (filled === 0) {
        statusEl.textContent = `🐠 Upload ${TOTAL_PHOTOS} photos to create your strip!`;
    } else if (remaining > 0) {
        statusEl.textContent = ` ${filled} uploaded! ${remaining} more to go 🐙`;
    } else {
        statusEl.textContent = "🎉 All photos ready!";
        sessionStorage.setItem("boothPhotos", JSON.stringify(photos));
        nextBtn.style.display = "block"; // force visible regardless of CSS opacity state
        nextBtn.classList.add("visible");
    }
}

// ── INIT ────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    if (IS_UPLOAD) permScreen.style.display = "none";
    buildStripSlots();
    buildUploadSlots();
    injectStripDecos();

    if (IS_UPLOAD) initUploadMode();

    [
        { key:"clownfish", top:"30%", left:"1%",  dur:5,   delay:0 },
        { key:"fish",      top:"22%", right:"1%", dur:4.5, delay:1,  flip:true },
        { key:"octopus",   top:"55%", right:"1%", dur:6,   delay:2 },
    ].forEach(cfg => {
        const img = document.createElement("img");
        img.className = "side-sticker";
        img.src = STICKERS[cfg.key]; img.alt = cfg.key;
        img.style.cssText = `width:60px;top:${cfg.top};${cfg.left?"left:"+cfg.left:"right:"+cfg.right};animation-duration:${cfg.dur}s;animation-delay:${cfg.delay}s;${cfg.flip?"transform:scaleX(-1);":""}`;
        document.body.appendChild(img);
    });

    [
        {s:10,l:"5%", b:"5%", d:7,  dl:0  },
        {s:18,l:"12%",b:"10%",d:9,  dl:1  },
        {s:8, l:"90%",b:"8%", d:6,  dl:2  },
        {s:22,l:"82%",b:"5%", d:10, dl:.5 },
        {s:12,l:"50%",b:"3%", d:8,  dl:3  },
    ].forEach(b => {
        const div = document.createElement("div");
        div.className = "bubble";
        div.style.cssText = `width:${b.s}px;height:${b.s}px;left:${b.l};bottom:${b.b};animation-duration:${b.d}s;animation-delay:${b.dl}s;`;
        document.body.appendChild(div);
    });
});