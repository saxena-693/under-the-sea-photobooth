// ============================================
//  Under The Sea — Photo Booth
//  index.js  |  landing page animations
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    injectFloatingStickers();
    injectBubbles();
});

// ── FLOATING STICKERS ──────────────────────
function injectFloatingStickers() {
    const configs = [
        // { key, bottom, top, left, right, width, duration, delay, flip, extraClass }
        { key:"shell",     bottom:"110px", left:"5%",   width:70,  duration:4,   delay:0   },
        { key:"shells",    bottom:"105px", right:"6%",  width:80,  duration:5,   delay:1   },
        { key:"wave",      bottom:"100px", left:"30%",  width:90,  duration:3,   delay:0,   extraClass:"sway" },
        { key:"wave",      bottom:"100px", right:"28%", width:70,  duration:3.5, delay:.5,  flip:true, extraClass:"sway" },
        { key:"coral",     bottom:"115px", left:"18%",  width:85,  duration:6,   delay:1.5 },
        { key:"coral",     bottom:"110px", right:"16%", width:75,  duration:5.5, delay:.8,  flip:true },
        { key:"clownfish", top:"15%",      left:"5%",   width:65,  duration:5,   delay:.3  },
        { key:"fish",      top:"20%",      right:"7%",  width:75,  duration:4.5, delay:1.2, flip:true },
        { key:"octopus",   top:"45%",      right:"4%",  width:80,  duration:6,   delay:2   },
    ];

    configs.forEach(cfg => {
        const img = document.createElement("img");
        img.className = "float-sticker" + (cfg.extraClass ? " " + cfg.extraClass : "");
        img.src = STICKERS[cfg.key];
        img.alt = cfg.key;

        const s = img.style;
        if (cfg.bottom) s.bottom = cfg.bottom;
        if (cfg.top)    s.top    = cfg.top;
        if (cfg.left)   s.left   = cfg.left;
        if (cfg.right)  s.right  = cfg.right;
        s.width           = cfg.width + "px";
        s.animationDuration  = cfg.duration + "s";
        s.animationDelay     = (cfg.delay || 0) + "s";
        if (cfg.flip) s.transform = "scaleX(-1)";

        document.body.appendChild(img);
    });
}

// ── BUBBLES ────────────────────────────────
function injectBubbles() {
    const bubbles = [
        { size:12, left:"8%",  bottom:"10%", dur:7,  delay:0   },
        { size:20, left:"15%", bottom:"5%",  dur:9,  delay:1   },
        { size:8,  left:"25%", bottom:"15%", dur:6,  delay:2   },
        { size:16, left:"70%", bottom:"8%",  dur:8,  delay:.5  },
        { size:10, left:"80%", bottom:"20%", dur:7,  delay:3   },
        { size:24, left:"88%", bottom:"5%",  dur:10, delay:1.5 },
        { size:14, left:"50%", bottom:"12%", dur:8,  delay:4   },
        { size:9,  left:"60%", bottom:"25%", dur:6.5,delay:2.5 },
    ];

    bubbles.forEach(b => {
        const div = document.createElement("div");
        div.className = "bubble";
        div.style.cssText = `
      width:${b.size}px; height:${b.size}px;
      left:${b.left}; bottom:${b.bottom};
      animation-duration:${b.dur}s;
      animation-delay:${b.delay}s;
    `;
        document.body.appendChild(div);
    });
}