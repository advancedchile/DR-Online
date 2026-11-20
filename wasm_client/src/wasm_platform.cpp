#include "stdafx.h"
#include <emscripten.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stdarg.h>
#include <sys/stat.h>
#include <unistd.h>
#include <time.h>
#include <vector>
#include <string>
#include <map>
#include <deque>

#include "dragon.h"
#include "directdraw.h"
#include "directinput.h"
#include "directsound.h"

extern char* g_DestBackBuf;
extern DIRECTDRAWINFO g_DirectDrawInfo;
extern HWND g_hwndMain;
extern HINSTANCE g_hInstance;
extern BOOL g_bIsActive;
DIMOUSESTATE g_DirectInputMouseState = {0};
extern BYTE g_aCurrentKeys[256];

// ============================================================================
// DirectSound / DirectInput Extern GUIDs & Methods
// ============================================================================

GUID IID_IDirectSound3DBuffer = {0};
GUID IID_IDirectSound3DListener = {0};
GUID GUID_SysKeyboard = {0};
GUID GUID_SysMouse = {0};
DIDATAFORMAT c_dfDIKeyboard = { sizeof(DIDATAFORMAT) };
DIDATAFORMAT c_dfDIMouse = { sizeof(DIDATAFORMAT) };
GUID IID_IDirectInput8 = {0};

HRESULT IDirectSoundBuffer::Play(DWORD, DWORD, DWORD dwFlags) {
    m_status = DSBSTATUS_PLAYING | ((dwFlags & DSBPLAY_LOOPING) ? DSBSTATUS_LOOPING : 0);
    return DS_OK;
}

HRESULT IDirectSoundBuffer::Stop() {
    m_status = 0;
    return DS_OK;
}

// ============================================================================
// 1. Virtual File System On-Demand Sync Fetcher (__wrap_fopen / dr_wasm_fopen)
// ============================================================================

EM_JS(int, js_fetch_file_to_fs, (const char* rawPath), {
    var p = UTF8ToString(rawPath);
    p = p.split(String.fromCharCode(92)).join('/').trim();
    while (p.indexOf('./') === 0) p = p.substring(2);
    while (p.indexOf('/') === 0) p = p.substring(1);
    if (!p) return 0;

    var pLower = p.toLowerCase();
    // Skip known optional/legacy probe files that do not exist in DragonRajaGlobal data0
    // so the browser console is not polluted with 404 Not Found errors.
    if (pLower === 'dragonraja.b' ||
        pLower === 'effect/lightning.ab' ||
        pLower === 'text/lightning.txt' ||
        pLower === 'data_b5/beta.txt' ||
        pLower === 'data/han.fnt' ||
        pLower === 'data/eng.fnt' ||
        pLower === 'data/cursorani.txt' ||
        pLower === 'data/man_list.txt' ||
        pLower === 'map/add.csp' ||
        pLower === 'temp.bmp' ||
        pLower === 'images/ui/legacy/newdestpoint.dat' ||
        pLower === 'character/armor_after.ani' ||
        pLower === 'character/body_after.ani' ||
        pLower === 'character/line_after.ani') {
        return 0;
    }

    var fsPath = '/' + p;
    var fsPathLower = '/' + pLower;
    try {
        var st = FS.stat(fsPathLower);
        if (st && st.size >= 0) return 1;
    } catch (e) {}
    try {
        var st2 = FS.stat(fsPath);
        if (st2 && st2.size >= 0) return 1;
    } catch (e) {}

    if (Module._missingFiles && Module._missingFiles[pLower]) {
        return 0;
    }
    if (!Module._missingFiles) Module._missingFiles = {};

    function writeToFs(targetPath, bytes) {
        var parts = targetPath.split('/');
        var cur = '';
        for (var i = 1; i < parts.length - 1; i++) {
            cur += '/' + parts[i];
            try { FS.mkdir(cur); } catch (e) {}
        }
        FS.writeFile(targetPath, bytes);
    }

    try {
        var apiBase = (typeof window !== 'undefined' && window.DR_API_BASE) ? window.DR_API_BASE : '';
        var xhr = new XMLHttpRequest();
        xhr.open('GET', apiBase + '/api/data0/raw?path=' + encodeURIComponent(p), false);
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
        xhr.send(null);
        if (xhr.status === 200 && typeof xhr.responseText === 'string') {
            var txt = xhr.responseText;
            var bytes = new Uint8Array(txt.length);
            for (var b = 0; b < txt.length; b++) {
                bytes[b] = txt.charCodeAt(b) & 0xff;
            }
            writeToFs(fsPathLower, bytes);
            return 1;
        } else {
            Module._missingFiles[pLower] = true;
            return 0;
        }
    } catch (e) {
        Module._missingFiles[pLower] = true;
        return 0;
    }
});

EM_JS(void, js_start_core_preload, (), {
    if (Module._corePreloadStarted) return;
    Module._corePreloadStarted = true;
    if (!Module._loadedBundles) Module._loadedBundles = {};

    Module._unpackBundleBuffer = function(buf, bundleKey) {
        try {
            var u8 = (buf instanceof Uint8Array) ? buf : new Uint8Array(buf);
            if (u8.length < 4) return 0;
            var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
            var count = dv.getUint32(0, true);
            var off = 4;
            var dec = (typeof TextDecoder !== 'undefined') ? new TextDecoder('utf-8') : null;
            for (var i = 0; i < count && off + 6 <= u8.length; i++) {
                var pLen = dv.getUint16(off, true);
                off += 2;
                if (off + pLen + 4 > u8.length) break;
                var pathStr = '';
                if (dec) {
                    pathStr = dec.decode(u8.subarray(off, off + pLen));
                } else {
                    for (var c = 0; c < pLen; c++) pathStr += String.fromCharCode(u8[off + c]);
                }
                off += pLen;
                var dLen = dv.getUint32(off, true);
                off += 4;
                if (off + dLen > u8.length) break;
                var fileBytes = u8.subarray(off, off + dLen);
                off += dLen;

                var parts = pathStr.split('/');
                var cur = '';
                for (var p = 1; p < parts.length - 1; p++) {
                    cur += '/' + parts[p];
                    try { FS.mkdir(cur); } catch (e) {}
                }
                try { FS.writeFile(pathStr, fileBytes); } catch (e) {}
            }
            Module._loadedBundles[bundleKey] = true;
            return count;
        } catch (e) {
            return 0;
        }
    };

    var apiBase = (typeof window !== 'undefined' && window.DR_API_BASE) ? window.DR_API_BASE : '';
    var prefetch = function(url, key) {
        fetch(url, { method: 'GET' })
            .then(function(r) { return r.ok ? r.arrayBuffer() : null; })
            .then(function(ab) { if (ab) Module._unpackBundleBuffer(ab, key); })
            .catch(function() {});
    };
    prefetch(apiBase + '/api/data0/bundle?pack=core', 'core');
    prefetch(apiBase + '/api/data0/bundle?pack=map&map=scholium', 'map:scholium');
});

EM_JS(void, js_preload_map_bundle, (const char* mapPtr), {
    if (!Module._loadedBundles) Module._loadedBundles = {};
    var apiBase = (typeof window !== 'undefined' && window.DR_API_BASE) ? window.DR_API_BASE : '';

    function fetchSyncBundle(url, key) {
        if (Module._loadedBundles[key]) return;
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            xhr.overrideMimeType('text/plain; charset=x-user-defined');
            xhr.send(null);
            if (xhr.status === 200 && typeof xhr.responseText === 'string' && xhr.responseText.length >= 4) {
                var txt = xhr.responseText;
                var bytes = new Uint8Array(txt.length);
                for (var b = 0; b < txt.length; b++) bytes[b] = txt.charCodeAt(b) & 0xff;
                if (typeof Module._unpackBundleBuffer === 'function') {
                    Module._unpackBundleBuffer(bytes, key);
                }
            }
        } catch (e) {}
    }

    if (!Module._loadedBundles['core']) {
        fetchSyncBundle(apiBase + '/api/data0/bundle?pack=core', 'core');
    }
    var mapName = mapPtr ? UTF8ToString(mapPtr).trim().toLowerCase() : '';
    if (mapName && !Module._loadedBundles['map:' + mapName]) {
        fetchSyncBundle(apiBase + '/api/data0/bundle?pack=map&map=' + encodeURIComponent(mapName), 'map:' + mapName);
    }
});

extern "C" void dr_wasm_start_core_preload(void) {
    js_start_core_preload();
}

extern "C" void dr_wasm_preload_map_bundle(const char* mapName) {
    js_preload_map_bundle(mapName);
}

extern "C" FILE* __real_fopen(const char* path, const char* mode);

static void normalize_rel_path(const char* inPath, char* outPath, size_t maxLen) {
    if (!inPath || !*inPath) {
        outPath[0] = 0;
        return;
    }
    char tmp[512];
    strncpy(tmp, inPath, sizeof(tmp) - 1);
    tmp[sizeof(tmp) - 1] = 0;
    size_t len = strlen(tmp);
    while (len > 0 && (tmp[len - 1] == '\r' || tmp[len - 1] == '\n' || tmp[len - 1] == ' ' || tmp[len - 1] == '\t')) {
        tmp[--len] = 0;
    }
    for (char* p = tmp; *p; ++p) {
        if (*p == '\\') *p = '/';
    }
    const char* s = tmp;
    while (*s == ' ' || *s == '\t') s++;
    while (s[0] == '.' && s[1] == '/') s += 2;
    while (s[0] == '/') s += 1;
    snprintf(outPath, maxLen, "/%s", s);
}

static void ensure_parent_dirs(const char* absPath) {
    char tmp[512];
    strncpy(tmp, absPath, sizeof(tmp) - 1);
    tmp[sizeof(tmp) - 1] = 0;
    for (char* p = tmp + 1; *p; ++p) {
        if (*p == '/') {
            *p = 0;
            mkdir(tmp, 0777);
            *p = '/';
        }
    }
}

extern "C" FILE* __wrap_fopen(const char* path, const char* mode) {
    if (!path || !mode) return NULL;
    char norm[512];
    normalize_rel_path(path, norm, sizeof(norm));
    char normLower[512];
    for (size_t i = 0; i < sizeof(normLower); ++i) {
        normLower[i] = (char)tolower((unsigned char)norm[i]);
        if (!norm[i]) break;
    }
    if (mode[0] == 'r') {
        FILE* f = __real_fopen(normLower, mode);
        if (f) return f;
        f = __real_fopen(norm, mode);
        if (f) return f;
        if (js_fetch_file_to_fs(norm + 1)) {
            f = __real_fopen(normLower, mode);
            if (f) return f;
            return __real_fopen(norm, mode);
        }
        return NULL;
    } else {
        ensure_parent_dirs(normLower);
        return __real_fopen(normLower, mode);
    }
}

extern "C" FILE* dr_wasm_fopen(const char* path, const char* mode) {
    return __wrap_fopen(path, mode);
}

// ============================================================================
// 2. Canvas Backbuffer Presenter (RGB565 -> RGBA8888 on #dr-wasm-canvas)
// ============================================================================

extern int g_StartMenuOn;
extern int NowLoading;

static uint32_t g_rgbaBuffer[SCREEN_WIDTH * SCREEN_HEIGHT];

EM_JS(void, js_queue_text, (int x, int y, const char* strPtr, int r, int g, int b, int align), {
    if (!Module._textQueue) Module._textQueue = [];
    var text = strPtr ? UTF8ToString(strPtr) : '';
    if (!text) return;
    Module._textQueue.push({ x: x, y: y, text: text, r: r, g: g, b: b, align: align });
});

EM_JS(void, js_present_rgba, (const uint32_t* rgbaPtr, int width, int height), {
    var canvas = document.getElementById('dr-wasm-canvas');
    if (!canvas) return;
    if (canvas.width !== width || canvas.height !== height || !Module._ctx2d || !Module._imgData) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.imageRendering = 'auto';
        Module._ctx2d = canvas.getContext('2d', { alpha: false });
        Module._imgData = Module._ctx2d.createImageData(width, height);
        var wrap = document.getElementById('dr-wasm-wrapper');
        if (wrap) {
            if (width > 800) {
                wrap.style.width = '100vw';
                wrap.style.height = 'calc(100vw * ' + height + ' / ' + width + ')';
                wrap.style.maxHeight = '100vh';
                wrap.style.maxWidth = 'calc(100vh * ' + width + ' / ' + height + ')';
                wrap.style.aspectRatio = width + ' / ' + height;
            } else {
                wrap.style.height = '100vh';
                wrap.style.width = 'calc(100vh * 4 / 3)';
                wrap.style.maxWidth = '100vw';
                wrap.style.maxHeight = 'calc(100vw * 3 / 4)';
                wrap.style.aspectRatio = '4 / 3';
            }
        }
    }
    var byteLen = width * height * 4;
    var heap = (typeof HEAPU8 !== 'undefined') ? HEAPU8 : Module.HEAPU8;
    var src = new Uint8Array(heap.buffer, rgbaPtr, byteLen);
    Module._imgData.data.set(src);
    Module._ctx2d.putImageData(Module._imgData, 0, 0);
    if (Module._textQueue && Module._textQueue.length > 0) {
        var ctx = Module._ctx2d;
        ctx.font = '12px Tahoma, Verdana, Arial, sans-serif';
        ctx.textBaseline = 'top';
        for (var ti = 0; ti < Module._textQueue.length; ti++) {
            var item = Module._textQueue[ti];
            ctx.textAlign = item.align === 1 ? 'center' : (item.align === 2 ? 'right' : 'left');
            ctx.fillStyle = 'rgb(' + item.r + ',' + item.g + ',' + item.b + ')';
            ctx.fillText(item.text, item.x, item.y);
        }
        Module._textQueue.length = 0;
    }
    if (typeof window !== 'undefined') {
        if (!Module._firstFrameRendered) {
            Module._firstFrameRendered = true;
            window.dispatchEvent(new CustomEvent('dr-first-frame'));
        }
        var nowFps = performance.now();
        if (!Module._fpsLastTime) {
            Module._fpsLastTime = nowFps;
            Module._fpsFrames = 0;
        }
        Module._fpsFrames++;
        var elapsed = nowFps - Module._fpsLastTime;
        if (elapsed >= 500) {
            var fpsVal = Math.round((Module._fpsFrames * 1000) / elapsed);
            Module._fpsFrames = 0;
            Module._fpsLastTime = nowFps;
            window.__drFps = fpsVal;
            window.dispatchEvent(new CustomEvent('dr-fps-update', { detail: fpsVal }));
        }
    }
});

extern "C" void wasm_present_backbuffer(const void* buf, int width, int height) {
    if (!buf || width <= 0 || height <= 0) return;
    const uint16_t* src = (const uint16_t*)buf;
    int outW = (g_StartMenuOn || NowLoading) ? 800 : width;
    int outH = (g_StartMenuOn || NowLoading) ? 600 : height;
    if (outW > width) outW = width;
    if (outH > height) outH = height;
    if (outW * outH > SCREEN_WIDTH * SCREEN_HEIGHT) return;

    int dstIdx = 0;
    for (int y = 0; y < outH; ++y) {
        const uint16_t* row = src + y * width;
        for (int x = 0; x < outW; ++x) {
            uint16_t px = row[x];
            uint32_t r = ((px >> 11) & 0x1F);
            uint32_t g = ((px >> 5) & 0x3F);
            uint32_t b = (px & 0x1F);
            r = (r << 3) | (r >> 2);
            g = (g << 2) | (g >> 4);
            b = (b << 3) | (b >> 2);
            g_rgbaBuffer[dstIdx++] = 0xFF000000u | (b << 16) | (g << 8) | r;
        }
    }
    js_present_rgba(g_rgbaBuffer, outW, outH);
}

// ============================================================================
// 3. WebAudio / HTML5 Sound & BGM Bridge
// ============================================================================

EM_JS(void, js_play_sound, (int index, const char* filenamePtr, int loop, int volumePct), {
    var fname = filenamePtr ? UTF8ToString(filenamePtr).trim() : '';
    if (!Module._audioMap) Module._audioMap = {};
    if (!Module._audioUnlockInstalled && typeof window !== 'undefined') {
        Module._audioUnlockInstalled = true;
        var resumePendingAudio = function() {
            if (!Module._audioMap) return;
            for (var k in Module._audioMap) {
                var a = Module._audioMap[k];
                if (a && a.loop && a.paused) {
                    a.play().catch(function(){});
                }
            }
        };
        ['mousedown', 'pointerdown', 'keydown', 'touchstart'].forEach(function(ev) {
            window.addEventListener(ev, resumePendingAudio, { capture: true, passive: true });
        });
    }
    var apiBase = (typeof window !== 'undefined' && window.DR_API_BASE) ? window.DR_API_BASE : '';
    var url = '';
    if (fname) {
        fname = fname.split(String.fromCharCode(92)).join('/');
        while (fname.indexOf('./') === 0) fname = fname.substring(2);
        if (fname.toLowerCase().indexOf('sound/') !== 0) {
            if (index > 0 && index < 100 && fname.toLowerCase().indexOf('static/') !== 0) {
                url = apiBase + '/api/data0/raw?path=' + encodeURIComponent('sound/static/' + fname);
            } else {
                url = apiBase + '/api/data0/raw?path=' + encodeURIComponent('sound/' + fname);
            }
        } else {
            url = apiBase + '/api/data0/raw?path=' + encodeURIComponent(fname);
        }
    } else {
        var padded = String(index).padStart(4, '0') + '.wav';
        var rel = (index > 0 && index < 100) ? ('sound/static/' + padded) : ('sound/' + padded);
        url = apiBase + '/api/data0/raw?path=' + encodeURIComponent(rel);
    }
    try {
        var existing = Module._audioMap[index];
        if (existing) {
            if (loop && existing.loop && !existing.paused) {
                return;
            }
            // Do not cut off & restart an ambient sound that is already playing
            if (!loop && volumePct < 100 && !existing.paused && !existing.ended) {
                return;
            }
            existing.pause();
            existing.currentTime = 0;
        }
        var audio = new Audio(url);
        audio.loop = !!loop;
        audio.muted = !!(typeof document !== 'undefined' && document.hidden);
        var isMusic = (index >= 1 && index <= 20) || (index >= 201 && index <= 220) || !!loop;
        var baseVol = isMusic ? (Module._musicVol !== undefined ? Module._musicVol : 0.7)
                              : (Module._sfxVol !== undefined ? Module._sfxVol : 0.85);
        var scale = (volumePct >= 0 && volumePct <= 100) ? (volumePct / 100.0) : 1.0;
        audio.volume = Math.max(0, Math.min(1, baseVol * scale));
        Module._audioMap[index] = audio;
        audio.play().catch(function(){});
    } catch (e) {}
});

EM_JS(void, js_stop_sound, (int index), {
    if (!Module._audioMap) return;
    var a = Module._audioMap[index];
    if (a) {
        try { a.pause(); a.currentTime = 0; } catch (e) {}
        delete Module._audioMap[index];
    }
});

EM_JS(void, js_set_volume, (int volume, int is_music), {
    var v = Math.max(0, Math.min(100, volume)) / 100.0;
    if (is_music) Module._musicVol = v;
    else Module._sfxVol = v;
    if (!Module._audioMap) return;
    for (var k in Module._audioMap) {
        var idx = parseInt(k, 10);
        var a = Module._audioMap[k];
        if (!a) continue;
        var m = (idx >= 1 && idx <= 20) || (idx >= 201 && idx <= 220) || !!a.loop;
        if (!!is_music === m) {
            try { a.volume = v; } catch (e) {}
        }
    }
});

EM_JS(int, js_is_sound_playing, (int index), {
    if (!Module._audioMap) return 0;
    var a = Module._audioMap[index];
    if (!a) return 0;
    return (!a.paused && !a.ended) ? 1 : 0;
});

extern "C" void dr_wasm_play_sound(int index, const char* filename, int loop) {
    js_play_sound(index, filename ? filename : "", loop, 100);
}
extern "C" void dr_wasm_play_sound_spatial(int index, const char* filename, int loop, int volumePct) {
    js_play_sound(index, filename ? filename : "", loop, volumePct);
}
extern "C" void dr_wasm_stop_sound(int index) {
    js_stop_sound(index);
}
extern "C" void dr_wasm_set_volume(int volume, int is_music) {
    js_set_volume(volume, is_music);
}
extern "C" int dr_wasm_is_sound_playing(int index) {
    return js_is_sound_playing(index);
}
extern "C" void dr_wasm_play_bgm(const char* path, int loop) {
    js_play_sound(201, path ? path : "", loop, 100);
}
extern "C" void dr_wasm_stop_bgm(void) {
    js_stop_sound(201);
}
EM_JS(void, js_open_help_modal, (), {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dr-open-help'));
    }
});

extern "C" void dr_wasm_open_help_modal(void) {
    js_open_help_modal();
}

extern "C" int ijlInit(void*) { return 0; }
extern "C" int ijlWrite(void*, int) { return 0; }
extern "C" int ijlFree(void*) { return 0; }

// ============================================================================
// 4. Built-in 6x12 Bitmap Font for GDI TextOutA onto RGB565 Backbuffer
// ============================================================================

static const uint8_t s_font5x7[95][5] = {
    {0x00,0x00,0x00,0x00,0x00}, // ' '
    {0x00,0x00,0x5F,0x00,0x00}, // '!'
    {0x00,0x07,0x00,0x07,0x00}, // '"'
    {0x14,0x7F,0x14,0x7F,0x14}, // '#'
    {0x24,0x2A,0x7F,0x2A,0x12}, // '$'
    {0x23,0x13,0x08,0x64,0x62}, // '%'
    {0x36,0x49,0x55,0x22,0x50}, // '&'
    {0x00,0x05,0x03,0x00,0x00}, // '''
    {0x00,0x1C,0x22,0x41,0x00}, // '('
    {0x00,0x41,0x22,0x1C,0x00}, // ')'
    {0x14,0x08,0x3E,0x08,0x14}, // '*'
    {0x08,0x08,0x3E,0x08,0x08}, // '+'
    {0x00,0x50,0x30,0x00,0x00}, // ','
    {0x08,0x08,0x08,0x08,0x08}, // '-'
    {0x00,0x60,0x60,0x00,0x00}, // '.'
    {0x20,0x10,0x08,0x04,0x02}, // '/'
    {0x3E,0x51,0x49,0x45,0x3E}, // '0'
    {0x00,0x42,0x7F,0x40,0x00}, // '1'
    {0x42,0x61,0x51,0x49,0x46}, // '2'
    {0x21,0x41,0x45,0x4B,0x31}, // '3'
    {0x18,0x14,0x12,0x7F,0x10}, // '4'
    {0x27,0x45,0x45,0x45,0x39}, // '5'
    {0x3C,0x4A,0x49,0x49,0x30}, // '6'
    {0x01,0x71,0x09,0x05,0x03}, // '7'
    {0x36,0x49,0x49,0x49,0x36}, // '8'
    {0x06,0x49,0x49,0x29,0x1E}, // '9'
    {0x00,0x36,0x36,0x00,0x00}, // ':'
    {0x00,0x56,0x36,0x00,0x00}, // ';'
    {0x08,0x14,0x22,0x41,0x00}, // '<'
    {0x14,0x14,0x14,0x14,0x14}, // '='
    {0x00,0x41,0x22,0x14,0x08}, // '>'
    {0x02,0x01,0x51,0x09,0x06}, // '?'
    {0x32,0x49,0x79,0x41,0x3E}, // '@'
    {0x7E,0x11,0x11,0x11,0x7E}, // 'A'
    {0x7F,0x49,0x49,0x49,0x36}, // 'B'
    {0x3E,0x41,0x41,0x41,0x22}, // 'C'
    {0x7F,0x41,0x41,0x22,0x1C}, // 'D'
    {0x7F,0x49,0x49,0x49,0x41}, // 'E'
    {0x7F,0x09,0x09,0x09,0x01}, // 'F'
    {0x3E,0x41,0x49,0x49,0x7A}, // 'G'
    {0x7F,0x08,0x08,0x08,0x7F}, // 'H'
    {0x00,0x41,0x7F,0x41,0x00}, // 'I'
    {0x20,0x40,0x41,0x3F,0x01}, // 'J'
    {0x7F,0x08,0x14,0x22,0x41}, // 'K'
    {0x7F,0x40,0x40,0x40,0x40}, // 'L'
    {0x7F,0x02,0x0C,0x02,0x7F}, // 'M'
    {0x7F,0x04,0x08,0x10,0x7F}, // 'N'
    {0x3E,0x41,0x41,0x41,0x3E}, // 'O'
    {0x7F,0x09,0x09,0x09,0x06}, // 'P'
    {0x3E,0x41,0x51,0x21,0x5E}, // 'Q'
    {0x7F,0x09,0x19,0x29,0x46}, // 'R'
    {0x46,0x49,0x49,0x49,0x31}, // 'S'
    {0x01,0x01,0x7F,0x01,0x01}, // 'T'
    {0x3F,0x40,0x40,0x40,0x3F}, // 'U'
    {0x1F,0x20,0x40,0x20,0x1F}, // 'V'
    {0x3F,0x40,0x38,0x40,0x3F}, // 'W'
    {0x63,0x14,0x08,0x14,0x63}, // 'X'
    {0x07,0x08,0x70,0x08,0x07}, // 'Y'
    {0x61,0x51,0x49,0x45,0x43}, // 'Z'
    {0x00,0x7F,0x41,0x41,0x00}, // '['
    {0x02,0x04,0x08,0x10,0x20}, // '\'
    {0x00,0x41,0x41,0x7F,0x00}, // ']'
    {0x04,0x02,0x01,0x02,0x04}, // '^'
    {0x40,0x40,0x40,0x40,0x40}, // '_'
    {0x00,0x01,0x02,0x04,0x00}, // '`'
    {0x20,0x54,0x54,0x54,0x78}, // 'a'
    {0x7F,0x48,0x44,0x44,0x38}, // 'b'
    {0x38,0x44,0x44,0x44,0x20}, // 'c'
    {0x38,0x44,0x44,0x48,0x7F}, // 'd'
    {0x38,0x54,0x54,0x54,0x18}, // 'e'
    {0x08,0x7E,0x09,0x01,0x02}, // 'f'
    {0x0C,0x52,0x52,0x52,0x3E}, // 'g'
    {0x7F,0x08,0x04,0x04,0x78}, // 'h'
    {0x00,0x44,0x7D,0x40,0x00}, // 'i'
    {0x20,0x40,0x44,0x3D,0x00}, // 'j'
    {0x7F,0x10,0x28,0x44,0x00}, // 'k'
    {0x00,0x41,0x7F,0x40,0x00}, // 'l'
    {0x7C,0x04,0x18,0x04,0x78}, // 'm'
    {0x7C,0x08,0x04,0x04,0x78}, // 'n'
    {0x38,0x44,0x44,0x44,0x38}, // 'o'
    {0x7C,0x14,0x14,0x14,0x08}, // 'p'
    {0x08,0x14,0x14,0x18,0x7C}, // 'q'
    {0x7C,0x08,0x04,0x04,0x08}, // 'r'
    {0x48,0x54,0x54,0x54,0x20}, // 's'
    {0x04,0x3F,0x44,0x40,0x20}, // 't'
    {0x3C,0x40,0x40,0x20,0x7C}, // 'u'
    {0x1C,0x20,0x40,0x20,0x1C}, // 'v'
    {0x3C,0x40,0x30,0x40,0x3C}, // 'w'
    {0x44,0x28,0x10,0x28,0x44}, // 'x'
    {0x0C,0x50,0x50,0x50,0x3C}, // 'y'
    {0x44,0x64,0x54,0x4C,0x44}, // 'z'
    {0x00,0x08,0x36,0x41,0x00}, // '{'
    {0x00,0x00,0x7F,0x00,0x00}, // '|'
    {0x00,0x41,0x36,0x08,0x00}, // '}'
    {0x10,0x08,0x08,0x10,0x08}, // '~'
};

static COLORREF s_hdcTextColor = RGB(255, 255, 255);
static COLORREF s_hdcBkColor = RGB(0, 0, 0);
static int s_hdcBkMode = TRANSPARENT;
static UINT s_hdcTextAlign = TA_LEFT;

static inline uint16_t colorref_to_rgb565(COLORREF c) {
    uint16_t r = (uint16_t)((c & 0xFF) >> 3);
    uint16_t g = (uint16_t)(((c >> 8) & 0xFF) >> 2);
    uint16_t b = (uint16_t)(((c >> 16) & 0xFF) >> 3);
    return (uint16_t)((r << 11) | (g << 5) | b);
}

static void draw_glyph_5x7_to_backbuf(int x, int y, char ch, uint16_t color565) {
    if (!g_DestBackBuf) return;
    uint16_t* dst = (uint16_t*)g_DestBackBuf;
    unsigned char uc = (unsigned char)ch;
    int idx = (uc >= 32 && uc <= 126) ? (uc - 32) : ('?' - 32);
    const uint8_t* cols = s_font5x7[idx];
    for (int col = 0; col < 5; ++col) {
        uint8_t bits = cols[col];
        int px = x + col;
        if (px < 0 || px >= SCREEN_WIDTH) continue;
        for (int row = 0; row < 7; ++row) {
            if (bits & (1 << row)) {
                int py = y + 2 + row;
                if (py >= 0 && py < SCREEN_HEIGHT) {
                    dst[py * SCREEN_WIDTH + px] = color565;
                }
            }
        }
    }
}

extern "C" {

HDC GetDC(HWND hWnd) { return (HDC)1; }
int ReleaseDC(HWND hWnd, HDC hDC) { return 1; }
HDC CreateCompatibleDC(HDC hdc) { return (HDC)2; }
BOOL DeleteDC(HDC hdc) { return TRUE; }
HBITMAP CreateCompatibleBitmap(HDC hdc, int cx, int cy) { return (HBITMAP)1; }
HGDIOBJ SelectObject(HDC hdc, HGDIOBJ h) { return h; }
BOOL DeleteObject(HGDIOBJ ho) { return TRUE; }
HGDIOBJ GetStockObject(int i) { return (HGDIOBJ)(intptr_t)(100 + i); }
HRGN CreateRectRgn(int x1, int y1, int x2, int y2) { return (HRGN)1; }
HBRUSH CreateSolidBrush(COLORREF color) { return (HBRUSH)1; }
int FillRect(HDC hDC, const RECT *lprc, HBRUSH hbr) { return 1; }
BOOL BitBlt(HDC hdc, int x, int y, int cx, int cy, HDC hdcSrc, int x1, int y1, DWORD rop) { return TRUE; }
int SetDIBitsToDevice(HDC hdc, int xDest, int yDest, DWORD w, DWORD h, int xSrc, int ySrc,
    UINT StartScan, UINT cLines, const VOID *lpvBits, const BITMAPINFO *lpbmi, UINT ColorUse) { return (int)cLines; }
int StretchDIBits(HDC hdc, int xDest, int yDest, int DestWidth, int DestHeight,
    int xSrc, int ySrc, int SrcWidth, int SrcHeight, const VOID *lpBits, const BITMAPINFO *lpbmi,
    UINT iUsage, DWORD rop) { return SrcHeight; }

HFONT CreateFontA(int cHeight, int cWidth, int cEscapement, int cOrientation, int cWeight,
                  DWORD bItalic, DWORD bUnderline, DWORD bStrikeOut, DWORD iCharSet,
                  DWORD iOutPrecision, DWORD iClipPrecision, DWORD iQuality,
                  DWORD iPitchAndFamily, LPCSTR pszFaceName) {
    return (HFONT)1;
}
HFONT CreateFontIndirectA(const LOGFONTA *lplf) { return (HFONT)1; }

COLORREF SetTextColor(HDC hdc, COLORREF color) {
    COLORREF old = s_hdcTextColor;
    s_hdcTextColor = color;
    return old;
}
COLORREF SetBkColor(HDC hdc, COLORREF color) {
    COLORREF old = s_hdcBkColor;
    s_hdcBkColor = color;
    return old;
}
int SetBkMode(HDC hdc, int mode) {
    int old = s_hdcBkMode;
    s_hdcBkMode = mode;
    return old;
}
UINT SetTextAlign(HDC hdc, UINT align) {
    UINT old = s_hdcTextAlign;
    s_hdcTextAlign = align;
    return old;
}

BOOL GetTextExtentPoint32A(HDC hdc, LPCSTR lpString, int c, LPSIZE psizl) {
    if (!psizl) return FALSE;
    if (!lpString || c <= 0) {
        psizl->cx = 0;
        psizl->cy = 12;
        return TRUE;
    }
    psizl->cx = c * 6;
    psizl->cy = 12;
    return TRUE;
}

BOOL TextOutA(HDC hdc, int x, int y, LPCSTR lpString, int c) {
    if (!lpString || c <= 0) return TRUE;
    char tmp[512];
    int n = c < (int)sizeof(tmp) - 1 ? c : (int)sizeof(tmp) - 1;
    memcpy(tmp, lpString, n);
    tmp[n] = '\0';

    int align = 0;
    if (s_hdcTextAlign & TA_CENTER) align = 1;
    else if (s_hdcTextAlign & TA_RIGHT) align = 2;

    int r = (int)(s_hdcTextColor & 0xFF);
    int g = (int)((s_hdcTextColor >> 8) & 0xFF);
    int b = (int)((s_hdcTextColor >> 16) & 0xFF);
    js_queue_text(x, y, tmp, r, g, b, align);
    return TRUE;
}

} // extern "C"

// ============================================================================
// 5. Win32 Window, Edit Control, and Message Queue Subsystem
// ============================================================================

struct WasmWindow {
    HWND hwnd;
    std::string className;
    std::string text;
    DWORD style;
    WNDPROC wndProc;
    HWND parent;
    int x, y, w, h;
    int selStart;
    int selEnd;
    int limitText;
};

static std::map<uintptr_t, WasmWindow> s_windows;
static std::map<std::string, WNDPROC> s_registeredClasses;
static uintptr_t s_nextHwnd = 0x1000;
static HWND s_focusedHwnd = NULL;
static HWND s_captureHwnd = NULL;
static std::deque<MSG> s_msgQueue;

#ifndef EM_GETSEL
#define EM_GETSEL               0x00B0
#define EM_SETSEL               0x00B1
#define EM_REPLACESEL           0x00C2
#define EM_LIMITTEXT            0x00C5
#endif
#ifndef MK_LBUTTON
#define MK_LBUTTON              0x0001
#define MK_RBUTTON              0x0002
#endif

static LRESULT CALLBACK DefaultEditWndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    auto it = s_windows.find((uintptr_t)hWnd);
    if (it == s_windows.end()) return 0;
    WasmWindow& win = it->second;

    switch (msg) {
        case WM_SETTEXT: {
            const char* s = (const char*)lParam;
            win.text = s ? s : "";
            win.selStart = (int)win.text.size();
            win.selEnd = win.selStart;
            return TRUE;
        }
        case WM_GETTEXT: {
            char* buf = (char*)lParam;
            int maxCount = (int)wParam;
            if (!buf || maxCount <= 0) return 0;
            strncpy(buf, win.text.c_str(), maxCount - 1);
            buf[maxCount - 1] = 0;
            return (LRESULT)strlen(buf);
        }
        case WM_GETTEXTLENGTH:
            return (LRESULT)win.text.size();
        case EM_LIMITTEXT:
            win.limitText = (int)wParam;
            return 0;
        case EM_SETSEL: {
            int start = (int)wParam;
            int end = (int)lParam;
            int len = (int)win.text.size();
            if (start < 0 || start > len) start = len;
            if (end < 0 || end > len) end = len;
            win.selStart = start;
            win.selEnd = end;
            return 0;
        }
        case EM_GETSEL: {
            DWORD* pStart = (DWORD*)wParam;
            DWORD* pEnd = (DWORD*)lParam;
            if (pStart) *pStart = (DWORD)win.selStart;
            if (pEnd) *pEnd = (DWORD)win.selEnd;
            return MAKELONG(win.selStart, win.selEnd);
        }
        case EM_REPLACESEL: {
            const char* rep = (const char*)lParam;
            if (rep) {
                int s = win.selStart < win.selEnd ? win.selStart : win.selEnd;
                int e = win.selStart > win.selEnd ? win.selStart : win.selEnd;
                if (s >= 0 && s <= (int)win.text.size()) {
                    win.text.replace(s, e - s, rep);
                    win.selStart = win.selEnd = s + (int)strlen(rep);
                }
            }
            return 0;
        }
        case WM_KEYDOWN: {
            if (wParam == VK_LEFT) {
                if (win.selEnd > 0) win.selEnd--;
                win.selStart = win.selEnd;
            } else if (wParam == VK_RIGHT) {
                if (win.selEnd < (int)win.text.size()) win.selEnd++;
                win.selStart = win.selEnd;
            } else if (wParam == VK_HOME) {
                win.selStart = win.selEnd = 0;
            } else if (wParam == VK_END) {
                win.selStart = win.selEnd = (int)win.text.size();
            } else if (wParam == VK_DELETE) {
                if (win.selEnd < (int)win.text.size()) {
                    win.text.erase(win.selEnd, 1);
                }
            }
            return 0;
        }
        case WM_CHAR: {
            unsigned char ch = (unsigned char)wParam;
            if (ch == '\b') {
                if (!win.text.empty() && win.selEnd > 0) {
                    win.text.erase(win.selEnd - 1, 1);
                    win.selEnd--;
                    win.selStart = win.selEnd;
                }
            } else if (ch >= 32 && ch != 127) {
                if (win.limitText <= 0 || (int)win.text.size() < win.limitText) {
                    if (win.selEnd < 0 || win.selEnd > (int)win.text.size()) {
                        win.selEnd = (int)win.text.size();
                    }
                    win.text.insert(win.text.begin() + win.selEnd, (char)ch);
                    win.selEnd++;
                    win.selStart = win.selEnd;
                }
            }
            return 0;
        }
        default:
            return 0;
    }
}

extern "C" {

ATOM RegisterClassExA(const WNDCLASSEXA* lpwcx) {
    if (lpwcx && lpwcx->lpszClassName) {
        s_registeredClasses[lpwcx->lpszClassName] = lpwcx->lpfnWndProc;
    }
    return 1;
}
ATOM RegisterClassA(const WNDCLASSA* lpWndClass) {
    if (lpWndClass && lpWndClass->lpszClassName) {
        s_registeredClasses[lpWndClass->lpszClassName] = lpWndClass->lpfnWndProc;
    }
    return 1;
}

HWND CreateWindowExA(DWORD dwExStyle, LPCSTR lpClassName, LPCSTR lpWindowName, DWORD dwStyle,
                     int X, int Y, int nWidth, int nHeight, HWND hWndParent, HMENU hMenu,
                     HINSTANCE hInstance, LPVOID lpParam) {
    uintptr_t id = s_nextHwnd++;
    WasmWindow win;
    win.hwnd = (HWND)id;
    win.className = lpClassName ? lpClassName : "";
    win.text = lpWindowName ? lpWindowName : "";
    win.style = dwStyle;
    win.parent = hWndParent;
    win.x = X;
    win.y = Y;
    win.w = nWidth > 0 ? nWidth : SCREEN_WIDTH;
    win.h = nHeight > 0 ? nHeight : SCREEN_HEIGHT;
    win.selStart = 0;
    win.selEnd = 0;
    win.limitText = 256;
    win.wndProc = DefWindowProcA;

    if (strcasecmp(win.className.c_str(), "edit") == 0) {
        win.wndProc = DefaultEditWndProc;
    } else {
        auto it = s_registeredClasses.find(win.className);
        if (it != s_registeredClasses.end() && it->second) {
            win.wndProc = it->second;
        } else if (!s_registeredClasses.empty() && s_registeredClasses.begin()->second) {
            win.wndProc = s_registeredClasses.begin()->second;
        }
    }
    s_windows[id] = win;
    if (!s_focusedHwnd) s_focusedHwnd = win.hwnd;
    return win.hwnd;
}

BOOL DestroyWindow(HWND hWnd) {
    s_windows.erase((uintptr_t)hWnd);
    if (s_focusedHwnd == hWnd) s_focusedHwnd = g_hwndMain;
    return TRUE;
}

BOOL ShowWindow(HWND hWnd, int nCmdShow) { return TRUE; }
BOOL UpdateWindow(HWND hWnd) { return TRUE; }
BOOL MoveWindow(HWND hWnd, int X, int Y, int nWidth, int nHeight, BOOL bRepaint) { return TRUE; }
BOOL SetWindowPos(HWND hWnd, HWND hWndInsertAfter, int X, int Y, int cx, int cy, UINT uFlags) { return TRUE; }

BOOL GetClientRect(HWND hWnd, LPRECT lpRect) {
    if (!lpRect) return FALSE;
    lpRect->left = 0;
    lpRect->top = 0;
    lpRect->right = SCREEN_WIDTH;
    lpRect->bottom = SCREEN_HEIGHT;
    return TRUE;
}
BOOL GetWindowRect(HWND hWnd, LPRECT lpRect) {
    return GetClientRect(hWnd, lpRect);
}
BOOL ClientToScreen(HWND hWnd, LPPOINT lpPoint) { return TRUE; }
BOOL ScreenToClient(HWND hWnd, LPPOINT lpPoint) { return TRUE; }
BOOL AdjustWindowRectEx(LPRECT lpRect, DWORD dwStyle, BOOL bMenu, DWORD dwExStyle) { return TRUE; }
BOOL AdjustWindowRect(LPRECT lpRect, DWORD dwStyle, BOOL bMenu) { return TRUE; }

HWND FindWindowA(LPCSTR lpClassName, LPCSTR lpWindowName) {
    return NULL;
}
HWND GetActiveWindow(void) { return g_hwndMain; }
HWND GetForegroundWindow(void) { return g_hwndMain; }
BOOL SetForegroundWindow(HWND hWnd) { return TRUE; }

HWND SetFocus(HWND hWnd) {
    HWND old = s_focusedHwnd;
    s_focusedHwnd = hWnd;
    return old;
}
HWND GetFocus(void) {
    return s_focusedHwnd ? s_focusedHwnd : g_hwndMain;
}

LONG SetWindowLongA(HWND hWnd, int nIndex, LONG dwNewLong) {
    auto it = s_windows.find((uintptr_t)hWnd);
    if (it == s_windows.end()) return 0;
    if (nIndex == GWL_WNDPROC) {
        WNDPROC old = it->second.wndProc;
        it->second.wndProc = (WNDPROC)(intptr_t)dwNewLong;
        return (LONG)(intptr_t)old;
    }
    return 0;
}
LONG GetWindowLongA(HWND hWnd, int nIndex) {
    auto it = s_windows.find((uintptr_t)hWnd);
    if (it == s_windows.end()) return 0;
    if (nIndex == GWL_WNDPROC) return (LONG)(intptr_t)it->second.wndProc;
    if (nIndex == GWL_STYLE) return (LONG)it->second.style;
    return 0;
}

LRESULT CallWindowProcA(WNDPROC lpPrevWndFunc, HWND hWnd, UINT Msg, WPARAM wParam, LPARAM lParam) {
    if (lpPrevWndFunc) return lpPrevWndFunc(hWnd, Msg, wParam, lParam);
    return DefaultEditWndProc(hWnd, Msg, wParam, lParam);
}

LRESULT DefWindowProcA(HWND hWnd, UINT Msg, WPARAM wParam, LPARAM lParam) {
    auto it = s_windows.find((uintptr_t)hWnd);
    if (it != s_windows.end() && strcasecmp(it->second.className.c_str(), "edit") == 0) {
        return DefaultEditWndProc(hWnd, Msg, wParam, lParam);
    }
    return 0;
}

LRESULT SendMessageA(HWND hWnd, UINT Msg, WPARAM wParam, LPARAM lParam) {
    auto it = s_windows.find((uintptr_t)hWnd);
    if (it != s_windows.end() && it->second.wndProc) {
        return it->second.wndProc(hWnd, Msg, wParam, lParam);
    }
    return DefWindowProcA(hWnd, Msg, wParam, lParam);
}

BOOL PostMessageA(HWND hWnd, UINT Msg, WPARAM wParam, LPARAM lParam) {
    if (Msg == WM_CLOSE || Msg == WM_QUIT) {
        return TRUE;
    }
    MSG m;
    m.hwnd = hWnd ? hWnd : g_hwndMain;
    m.message = Msg;
    m.wParam = wParam;
    m.lParam = lParam;
    m.time = GetTickCount();
    m.pt.x = g_pointMouseX;
    m.pt.y = g_pointMouseY;
    s_msgQueue.push_back(m);
    return TRUE;
}

void PostQuitMessage(int nExitCode) {}

BOOL SetWindowTextA(HWND hWnd, LPCSTR lpString) {
    SendMessageA(hWnd, WM_SETTEXT, 0, (LPARAM)lpString);
    return TRUE;
}
int GetWindowTextA(HWND hWnd, LPSTR lpString, int nMaxCount) {
    return (int)SendMessageA(hWnd, WM_GETTEXT, (WPARAM)nMaxCount, (LPARAM)lpString);
}
int GetWindowTextLengthA(HWND hWnd) {
    return (int)SendMessageA(hWnd, WM_GETTEXTLENGTH, 0, 0);
}

BOOL PeekMessageA(LPMSG lpMsg, HWND hWnd, UINT wMsgFilterMin, UINT wMsgFilterMax, UINT wRemoveMsg) {
    if (s_msgQueue.empty()) return FALSE;
    if (lpMsg) *lpMsg = s_msgQueue.front();
    if (wRemoveMsg & PM_REMOVE) {
        s_msgQueue.pop_front();
    }
    return TRUE;
}

BOOL GetMessageA(LPMSG lpMsg, HWND hWnd, UINT wMsgFilterMin, UINT wMsgFilterMax) {
    if (s_msgQueue.empty()) return FALSE;
    if (lpMsg) *lpMsg = s_msgQueue.front();
    s_msgQueue.pop_front();
    return TRUE;
}

BOOL TranslateMessage(const MSG* lpMsg) { return TRUE; }

LRESULT DispatchMessageA(const MSG* lpMsg) {
    if (!lpMsg) return 0;
    HWND target = lpMsg->hwnd ? lpMsg->hwnd : g_hwndMain;
    if ((lpMsg->message == WM_KEYDOWN || lpMsg->message == WM_KEYUP || lpMsg->message == WM_CHAR) && s_focusedHwnd) {
        target = s_focusedHwnd;
    }
    return SendMessageA(target, lpMsg->message, lpMsg->wParam, lpMsg->lParam);
}

HDC BeginPaint(HWND hWnd, LPPAINTSTRUCT lpPaint) {
    if (lpPaint) {
        memset(lpPaint, 0, sizeof(PAINTSTRUCT));
        lpPaint->hdc = (HDC)1;
    }
    return (HDC)1;
}
BOOL EndPaint(HWND hWnd, const PAINTSTRUCT* lpPaint) { return TRUE; }

int MessageBoxA(HWND hWnd, LPCSTR lpText, LPCSTR lpCaption, UINT uType) {
    printf("[WASM MessageBox] %s: %s\n", lpCaption ? lpCaption : "Info", lpText ? lpText : "");
    return IDOK;
}

HWND SetCapture(HWND hWnd) {
    HWND old = s_captureHwnd;
    s_captureHwnd = hWnd;
    return old;
}
BOOL ReleaseCapture(void) {
    s_captureHwnd = NULL;
    return TRUE;
}
HCURSOR SetCursor(HCURSOR hCursor) { return hCursor; }
int ShowCursor(BOOL bShow) { return bShow ? 1 : 0; }
HICON LoadIconA(HINSTANCE hInstance, LPCSTR lpIconName) { return (HICON)1; }
HCURSOR LoadCursorA(HINSTANCE hInstance, LPCSTR lpCursorName) { return (HCURSOR)1; }
BOOL GetCursorPos(LPPOINT lpPoint) {
    if (lpPoint) { lpPoint->x = g_pointMouseX; lpPoint->y = g_pointMouseY; }
    return TRUE;
}
BOOL SetCursorPos(int X, int Y) { return TRUE; }
UINT_PTR SetTimer(HWND hWnd, UINT_PTR nIDEvent, UINT uElapse, void* lpTimerFunc) { return nIDEvent ? nIDEvent : 1; }
BOOL KillTimer(HWND hWnd, UINT_PTR uIDEvent) { return TRUE; }
int GetSystemMetrics(int nIndex) {
    if (nIndex == SM_CXSCREEN) return SCREEN_WIDTH;
    if (nIndex == SM_CYSCREEN) return SCREEN_HEIGHT;
    return 0;
}

SHORT GetAsyncKeyState(int vKey) {
    if (vKey >= 0 && vKey < 256 && g_aCurrentKeys[vKey]) return (SHORT)0x8000;
    return 0;
}
SHORT GetKeyState(int nVirtKey) {
    return GetAsyncKeyState(nVirtKey);
}

BOOL OpenClipboard(HWND hWndNewOwner) { return FALSE; }
BOOL CloseClipboard(void) { return TRUE; }
BOOL EmptyClipboard(void) { return TRUE; }
HANDLE GetClipboardData(UINT uFormat) { return NULL; }
HANDLE SetClipboardData(UINT uFormat, HANDLE hMem) { return NULL; }

} // extern "C"

// ============================================================================
// 6. Browser Mouse & Keyboard Input Exports (EMSCRIPTEN_KEEPALIVE)
// ============================================================================

extern "C" {

EMSCRIPTEN_KEEPALIVE void wasm_on_mouse_move(int x, int y) {
    int maxW = (g_StartMenuOn || NowLoading) ? 800 : SCREEN_WIDTH;
    int maxH = (g_StartMenuOn || NowLoading) ? 600 : SCREEN_HEIGHT;
    if (x < 0) x = 0;
    if (x >= maxW) x = maxW - 1;
    if (y < 0) y = 0;
    if (y >= maxH) y = maxH - 1;
    int dx = x - g_pointMouseX;
    int dy = y - g_pointMouseY;
    g_pointMouseX = x;
    g_pointMouseY = y;
    g_pointMouse.x = x;
    g_pointMouse.y = y;
    g_DirectInputMouseState.lX = dx;
    g_DirectInputMouseState.lY = dy;
    PostMessageA(g_hwndMain, WM_MOUSEMOVE, 0, MAKELONG(x, y));
}

EMSCRIPTEN_KEEPALIVE void wasm_on_mouse_button(int button, int down, int x, int y) {
    wasm_on_mouse_move(x, y);
    LPARAM lp = MAKELONG(g_pointMouseX, g_pointMouseY);
    if (button == 0) {
        if (down == 2) {
            PostMessageA(g_hwndMain, WM_LBUTTONDBLCLK, MK_LBUTTON, lp);
        } else if (down) {
            g_DirectInputMouseState.rgbButtons[0] = 0x80;
            PostMessageA(g_hwndMain, WM_LBUTTONDOWN, MK_LBUTTON, lp);
        } else {
            g_DirectInputMouseState.rgbButtons[0] = 0x00;
            PostMessageA(g_hwndMain, WM_LBUTTONUP, 0, lp);
        }
    } else if (button == 2) {
        if (down == 2) {
            PostMessageA(g_hwndMain, WM_RBUTTONDBLCLK, MK_RBUTTON, lp);
        } else if (down) {
            g_DirectInputMouseState.rgbButtons[1] = 0x80;
            PostMessageA(g_hwndMain, WM_RBUTTONDOWN, MK_RBUTTON, lp);
        } else {
            g_DirectInputMouseState.rgbButtons[1] = 0x00;
            PostMessageA(g_hwndMain, WM_RBUTTONUP, 0, lp);
        }
    }
}

EMSCRIPTEN_KEEPALIVE void wasm_on_key_event(int vkCode, int dikCode, int down) {
    if (dikCode > 0 && dikCode < 256) {
        g_aCurrentKeys[dikCode] = down ? 0x80 : 0x00;
    } else if (vkCode >= 0 && vkCode < 256) {
        g_aCurrentKeys[vkCode] = down ? 0x80 : 0x00;
    }
    HWND target = s_focusedHwnd ? s_focusedHwnd : g_hwndMain;
    PostMessageA(target, down ? WM_KEYDOWN : WM_KEYUP, (WPARAM)vkCode, 0);
}

EMSCRIPTEN_KEEPALIVE void wasm_on_char_event(int charCode) {
    HWND target = s_focusedHwnd ? s_focusedHwnd : g_hwndMain;
    PostMessageA(target, WM_CHAR, (WPARAM)charCode, 0);
}

} // extern "C"

// ============================================================================
// 7. WinSock Bridge (Bridging C++ t_packet Sockets to /api/wasm-net)
// ============================================================================

EM_JS(int, js_net_connect, (int sock, const char* ipPtr, int port), {
    if (!Module._netSockets) Module._netSockets = {};
    var ip = ipPtr ? UTF8ToString(ipPtr) : '127.0.0.1';
    Module._netSockets[sock] = { ip: ip, port: port, recvBuf: [], lastPoll: performance.now() };
    try {
        var apiBase = (typeof window !== 'undefined' && window.DR_API_BASE) ? window.DR_API_BASE : '';
        var xhr = new XMLHttpRequest();
        xhr.open('POST', apiBase + '/api/wasm-net?op=connect&sock=' + sock + '&port=' + port, false);
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
        xhr.send(null);
        if (xhr.status === 200 && typeof xhr.responseText === 'string' && xhr.responseText.length > 0) {
            var txt = xhr.responseText;
            var q = Module._netSockets[sock].recvBuf;
            for (var i = 0; i < txt.length; i++) q.push(txt.charCodeAt(i) & 0xff);
        }
    } catch (e) {}
    return 1;
});

EM_JS(int, js_net_send, (int sock, const uint8_t* ptr, int len), {
    if (!Module._netSockets || !Module._netSockets[sock]) return len;
    var s = Module._netSockets[sock];
    try {
        var heap = (typeof HEAPU8 !== 'undefined') ? HEAPU8 : Module.HEAPU8;
        var payload = new Uint8Array(heap.buffer, ptr, len);
        var copy = new Uint8Array(len);
        copy.set(payload);
        var apiBase = (typeof window !== 'undefined' && window.DR_API_BASE) ? window.DR_API_BASE : '';
        var xhr = new XMLHttpRequest();
        xhr.open('POST', apiBase + '/api/wasm-net?op=send&sock=' + sock + '&port=' + s.port, false);
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
        xhr.send(copy);
        s.lastPoll = performance.now();
        if (xhr.status === 200 && typeof xhr.responseText === 'string' && xhr.responseText.length > 0) {
            var txt = xhr.responseText;
            var q = s.recvBuf;
            for (var i = 0; i < txt.length; i++) q.push(txt.charCodeAt(i) & 0xff);
        }
    } catch (e) {}
    return len;
});

EM_JS(int, js_net_available, (int sock), {
    if (!Module._netSockets || !Module._netSockets[sock]) return 0;
    var s = Module._netSockets[sock];
    if (s.recvBuf.length === 0 && !s.polling) {
        var now = performance.now();
        if (!s.lastPoll || now - s.lastPoll > 450) {
            s.lastPoll = now;
            s.polling = true;
            try {
                var apiBase = (typeof window !== 'undefined' && window.DR_API_BASE) ? window.DR_API_BASE : '';
                fetch(apiBase + '/api/wasm-net?op=poll&sock=' + sock + '&port=' + s.port, {
                    method: 'POST',
                    cache: 'no-store'
                }).then(function(res) {
                    if (!res.ok) return null;
                    return res.arrayBuffer();
                }).then(function(ab) {
                    s.polling = false;
                    if (ab && ab.byteLength > 0) {
                        var arr = new Uint8Array(ab);
                        for (var i = 0; i < arr.length; i++) s.recvBuf.push(arr[i]);
                    }
                }).catch(function() {
                    s.polling = false;
                });
            } catch (e) {
                s.polling = false;
            }
        }
    }
    return s.recvBuf.length;
});

EM_JS(int, js_net_recv, (int sock, uint8_t* dstPtr, int maxLen), {
    if (!Module._netSockets || !Module._netSockets[sock]) return 0;
    var q = Module._netSockets[sock].recvBuf;
    if (!q || q.length === 0) return 0;
    var n = Math.min(maxLen, q.length);
    var heap = (typeof HEAPU8 !== 'undefined') ? HEAPU8 : Module.HEAPU8;
    for (var i = 0; i < n; i++) {
        heap[dstPtr + i] = q[i];
    }
    q.splice(0, n);
    return n;
});

EM_JS(void, js_net_close, (int sock), {
    if (Module._netSockets) delete Module._netSockets[sock];
});

static int s_nextSocketId = 10;
static int s_lastWsaError = 0;

int __wasm_fd_isset(SOCKET fd, fd_set_wasm* set) {
    if (!set) return 0;
    for (unsigned int i = 0; i < set->fd_count; ++i) {
        if (set->fd_array[i] == fd) return 1;
    }
    return 0;
}

extern "C" {

int WSAStartup(WORD wVersionRequested, LPWSADATA lpWSAData) {
    if (lpWSAData) memset(lpWSAData, 0, sizeof(WSADATA));
    return 0;
}
int WSACleanup(void) { return 0; }
int WSAGetLastError(void) { return s_lastWsaError; }
void WSASetLastError(int iError) { s_lastWsaError = iError; }

SOCKET socket(int af, int type, int protocol) {
    return (SOCKET)(s_nextSocketId++);
}
int closesocket(SOCKET s) {
    js_net_close((int)s);
    return 0;
}
int shutdown(SOCKET s, int how) { return 0; }
int ioctlsocket(SOCKET s, long cmd, u_long* argp) {
    if (cmd == (long)FIONREAD && argp) {
        *argp = (u_long)js_net_available((int)s);
    }
    return 0;
}
int setsockopt(SOCKET s, int level, int optname, const char* optval, int optlen) { return 0; }
int getsockopt(SOCKET s, int level, int optname, char* optval, int* optlen) { return 0; }
int bind(SOCKET s, const struct sockaddr* name, int namelen) { return 0; }
int listen(SOCKET s, int backlog) { return 0; }
SOCKET accept(SOCKET s, struct sockaddr* addr, int* addrlen) { return INVALID_SOCKET; }
int sendto(SOCKET s, const char* buf, int len, int flags, const struct sockaddr* to, int tolen) { return len; }
int recvfrom(SOCKET s, char* buf, int len, int flags, struct sockaddr* from, int* fromlen) { return 0; }

int connect(SOCKET s, const struct sockaddr* name, int namelen) {
    const struct sockaddr_in* sin = (const struct sockaddr_in*)name;
    int port = sin ? ntohs(sin->sin_port) : 9000;
    js_net_connect((int)s, "127.0.0.1", port);
    s_lastWsaError = 0;
    return 0;
}

int select(int nfds, fd_set* readfds, fd_set* writefds, fd_set* exceptfds, const struct timeval* timeout) {
    int ready = 0;
    if (exceptfds) {
        exceptfds->fd_count = 0;
    }
    if (writefds && writefds->fd_count > 0) {
        ready += (int)writefds->fd_count;
    }
    if (readfds && readfds->fd_count > 0) {
        u_int outCount = 0;
        SOCKET outArr[FD_SETSIZE];
        for (u_int i = 0; i < readfds->fd_count; ++i) {
            SOCKET fd = readfds->fd_array[i];
            if (js_net_available((int)fd) > 0) {
                outArr[outCount++] = fd;
                ready++;
            }
        }
        readfds->fd_count = outCount;
        for (u_int i = 0; i < outCount; ++i) readfds->fd_array[i] = outArr[i];
    }
    return ready;
}

int send(SOCKET s, const char* buf, int len, int flags) {
    if (!buf || len <= 0) return 0;
    return js_net_send((int)s, (const uint8_t*)buf, len);
}

int recv(SOCKET s, char* buf, int len, int flags) {
    if (!buf || len <= 0) return 0;
    int got = js_net_recv((int)s, (uint8_t*)buf, len);
    if (got == 0) {
        s_lastWsaError = WSAEWOULDBLOCK;
        return SOCKET_ERROR;
    }
    s_lastWsaError = 0;
    return got;
}

uint32_t inet_addr(const char* cp) { return 0x0100007F; }
char* inet_ntoa(struct in_addr in) { return (char*)"127.0.0.1"; }
uint16_t htons(uint16_t hostshort) { return (uint16_t)(((hostshort & 0xFF) << 8) | ((hostshort >> 8) & 0xFF)); }
uint16_t ntohs(uint16_t netshort) { return htons(netshort); }
uint32_t htonl(uint32_t hostlong) {
    return ((hostlong & 0xFF) << 24) | ((hostlong & 0xFF00) << 8) | ((hostlong >> 8) & 0xFF00) | ((hostlong >> 24) & 0xFF);
}
uint32_t ntohl(uint32_t netlong) { return htonl(netlong); }

struct hostent* gethostbyname(const char* name) {
    static struct hostent he;
    static char* addr_list[2];
    static uint32_t ip = 0x0100007F;
    addr_list[0] = (char*)&ip;
    addr_list[1] = NULL;
    he.h_name = (char*)(name ? name : "localhost");
    he.h_aliases = NULL;
    he.h_addrtype = AF_INET;
    he.h_length = 4;
    he.h_addr_list = addr_list;
    return &he;
}

} // extern "C"

// ============================================================================
// 8. Multimedia, INI, File System & CRT Helpers
// ============================================================================

extern "C" {

DWORD timeGetTime(void) {
    return (DWORD)emscripten_get_now();
}
DWORD GetTickCount(void) {
    return (DWORD)emscripten_get_now();
}
void Sleep(DWORD dwMilliseconds) {}

BOOL QueryPerformanceCounter(LARGE_INTEGER *lpPerformanceCount) {
    if (lpPerformanceCount) lpPerformanceCount->QuadPart = (LONGLONG)(emscripten_get_now() * 1000.0);
    return TRUE;
}
BOOL QueryPerformanceFrequency(LARGE_INTEGER *lpFrequency) {
    if (lpFrequency) lpFrequency->QuadPart = 1000000LL;
    return TRUE;
}

MMRESULT timeBeginPeriod(UINT uPeriod) { return TIMERR_NOERROR; }
MMRESULT timeEndPeriod(UINT uPeriod) { return TIMERR_NOERROR; }
MMRESULT timeGetDevCaps(LPTIMECAPS ptc, UINT cbtc) {
    if (ptc) { ptc->wPeriodMin = 1; ptc->wPeriodMax = 1000; }
    return TIMERR_NOERROR;
}

void GetLocalTime(LPSYSTEMTIME lpSystemTime) {
    if (!lpSystemTime) return;
    time_t now = time(NULL);
    struct tm* t = localtime(&now);
    memset(lpSystemTime, 0, sizeof(SYSTEMTIME));
    if (t) {
        lpSystemTime->wYear = (WORD)(t->tm_year + 1900);
        lpSystemTime->wMonth = (WORD)(t->tm_mon + 1);
        lpSystemTime->wDayOfWeek = (WORD)t->tm_wday;
        lpSystemTime->wDay = (WORD)t->tm_mday;
        lpSystemTime->wHour = (WORD)t->tm_hour;
        lpSystemTime->wMinute = (WORD)t->tm_min;
        lpSystemTime->wSecond = (WORD)t->tm_sec;
    }
}
void GetSystemTime(LPSYSTEMTIME lpSystemTime) {
    GetLocalTime(lpSystemTime);
}

HMODULE GetModuleHandleA(LPCSTR lpModuleName) { return (HMODULE)1; }
HMODULE LoadLibraryA(LPCSTR lpLibFileName) { return NULL; }
FARPROC GetProcAddress(HMODULE hModule, LPCSTR lpProcName) { return NULL; }
BOOL FreeLibrary(HMODULE hLibModule) { return TRUE; }

DWORD GetModuleFileNameA(HMODULE hModule, LPSTR lpFilename, DWORD nSize) {
    if (lpFilename && nSize > 0) {
        strncpy(lpFilename, ".\\DragonRaja.exe", nSize - 1);
        lpFilename[nSize - 1] = 0;
        return (DWORD)strlen(lpFilename);
    }
    return 0;
}
DWORD GetCurrentDirectoryA(DWORD nBufferLength, LPSTR lpBuffer) {
    if (lpBuffer && nBufferLength > 0) {
        strncpy(lpBuffer, ".", nBufferLength - 1);
        lpBuffer[nBufferLength - 1] = 0;
        return 1;
    }
    return 0;
}
BOOL SetCurrentDirectoryA(LPCSTR lpPathName) { return TRUE; }

UINT GetPrivateProfileIntA(LPCSTR lpAppName, LPCSTR lpKeyName, INT nDefault, LPCSTR lpFileName) {
    if (lpAppName && lpKeyName) {
        if (strcasecmp(lpKeyName, "ver") == 0) {
            return 400;
        }
        if (strcasecmp(lpKeyName, "server_count") == 0) {
            return 1;
        }
        if (strcasecmp(lpKeyName, "port") == 0 || strcasecmp(lpKeyName, "proxy_port") == 0) {
            return 9000;
        }
        if (strcasecmp(lpKeyName, "agent_port") == 0) {
            return 9001;
        }
    }
    return (UINT)nDefault;
}

DWORD GetPrivateProfileStringA(LPCSTR lpAppName, LPCSTR lpKeyName, LPCSTR lpDefault,
                               LPSTR lpReturnedString, DWORD nSize, LPCSTR lpFileName) {
    if (!lpReturnedString || nSize == 0) return 0;
    const char* val = lpDefault ? lpDefault : "";
    if (lpAppName && lpKeyName) {
        if (strcasecmp(lpAppName, "network") == 0 &&
            (strcasecmp(lpKeyName, "host1") == 0 || strcasecmp(lpKeyName, "host2") == 0)) {
            val = "127.0.0.1";
        } else if (strcasecmp(lpAppName, "nation") == 0 && strcasecmp(lpKeyName, "nation") == 0) {
            val = "USA";
        } else if (strcasecmp(lpAppName, "server_set") == 0) {
            if (strcasecmp(lpKeyName, "name1") == 0) val = "DragonRaja";
            else if (strcasecmp(lpKeyName, "name1_host1") == 0 || strcasecmp(lpKeyName, "name1_host2") == 0) val = "127.0.0.1";
        }
    }
    strncpy(lpReturnedString, val, nSize - 1);
    lpReturnedString[nSize - 1] = 0;
    return (DWORD)strlen(lpReturnedString);
}

BOOL WritePrivateProfileStringA(LPCSTR lpAppName, LPCSTR lpKeyName, LPCSTR lpString, LPCSTR lpFileName) {
    return TRUE;
}

HGLOBAL GlobalAlloc(UINT uFlags, SIZE_T dwBytes) {
    void* p = calloc(1, dwBytes ? dwBytes : 1);
    return (HGLOBAL)p;
}
HGLOBAL GlobalFree(HGLOBAL hMem) {
    if (hMem) free(hMem);
    return NULL;
}
LPVOID GlobalLock(HGLOBAL hMem) { return (LPVOID)hMem; }
BOOL GlobalUnlock(HGLOBAL hMem) { return TRUE; }

int MultiByteToWideChar(UINT CodePage, DWORD dwFlags, LPCSTR lpMultiByteStr, int cbMultiByte, LPWSTR lpWideCharStr, int cchWideChar) {
    if (!lpMultiByteStr) return 0;
    int len = cbMultiByte < 0 ? (int)strlen(lpMultiByteStr) + 1 : cbMultiByte;
    if (lpWideCharStr && cchWideChar > 0) {
        int n = len < cchWideChar ? len : cchWideChar;
        for (int i = 0; i < n; ++i) lpWideCharStr[i] = (WCHAR)(unsigned char)lpMultiByteStr[i];
        return n;
    }
    return len;
}
int WideCharToMultiByte(UINT CodePage, DWORD dwFlags, LPCWSTR lpWideCharStr, int cchWideChar, LPSTR lpMultiByteStr, int cbMultiByte, LPCSTR lpDefaultChar, LPBOOL lpUsedDefaultChar) {
    if (!lpWideCharStr) return 0;
    int len = 0;
    if (cchWideChar < 0) {
        while (lpWideCharStr[len]) len++;
        len++;
    } else {
        len = cchWideChar;
    }
    if (lpMultiByteStr && cbMultiByte > 0) {
        int n = len < cbMultiByte ? len : cbMultiByte;
        for (int i = 0; i < n; ++i) lpMultiByteStr[i] = (char)(lpWideCharStr[i] & 0xFF);
        return n;
    }
    return len;
}

int _stricmp(const char* a, const char* b) {
    if ((uintptr_t)a < 1024) a = NULL;
    if ((uintptr_t)b < 1024) b = NULL;
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    return strcasecmp(a, b);
}
int _strnicmp(const char* a, const char* b, size_t n) {
    if ((uintptr_t)a < 1024) a = NULL;
    if ((uintptr_t)b < 1024) b = NULL;
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    return strncasecmp(a, b, n);
}

char* _strupr(char* s) {
    if (!s) return NULL;
    for (char* p = s; *p; ++p) *p = (char)toupper((unsigned char)*p);
    return s;
}

char* _strlwr(char* s) {
    if (!s) return NULL;
    for (char* p = s; *p; ++p) *p = (char)tolower((unsigned char)*p);
    return s;
}

char* _itoa(int value, char* str, int radix) {
    if (!str) return NULL;
    if (radix == 16) sprintf(str, "%x", value);
    else sprintf(str, "%d", value);
    return str;
}
char* _ltoa(long value, char* str, int radix) { return _itoa((int)value, str, radix); }
char* _ultoa(unsigned long value, char* str, int radix) {
    if (!str) return NULL;
    if (radix == 16) sprintf(str, "%lx", value);
    else sprintf(str, "%lu", value);
    return str;
}

void _splitpath(const char* path, char* drive, char* dir, char* fname, char* ext) {
    if (drive) drive[0] = 0;
    if (dir) dir[0] = 0;
    if (fname) fname[0] = 0;
    if (ext) ext[0] = 0;
    if (!path) return;
    const char* lastSlash1 = strrchr(path, '/');
    const char* lastSlash2 = strrchr(path, '\\');
    const char* slash = lastSlash1 > lastSlash2 ? lastSlash1 : lastSlash2;
    const char* base = slash ? (slash + 1) : path;
    if (dir && slash) {
        size_t dlen = (size_t)(slash - path + 1);
        strncpy(dir, path, dlen);
        dir[dlen] = 0;
    }
    const char* dot = strrchr(base, '.');
    if (dot) {
        if (fname) {
            size_t flen = (size_t)(dot - base);
            strncpy(fname, base, flen);
            fname[flen] = 0;
        }
        if (ext) strcpy(ext, dot);
    } else {
        if (fname) strcpy(fname, base);
    }
}

void _makepath(char* path, const char* drive, const char* dir, const char* fname, const char* ext) {
    if (!path) return;
    path[0] = 0;
    if (drive && *drive) strcat(path, drive);
    if (dir && *dir) strcat(path, dir);
    if (fname && *fname) strcat(path, fname);
    if (ext && *ext) {
        if (ext[0] != '.') strcat(path, ".");
        strcat(path, ext);
    }
}

long _filelength(int fd) {
    struct stat st;
    if (fstat(fd, &st) == 0) return (long)st.st_size;
    return 0;
}

HINSTANCE ShellExecuteA(HWND hwnd, LPCSTR lpOperation, LPCSTR lpFile, LPCSTR lpParameters, LPCSTR lpDirectory, INT nShowCmd) {
    return (HINSTANCE)33;
}
DWORD WaitForSingleObject(HANDLE hHandle, DWORD dwMilliseconds) { return 0; }
BOOL CloseHandle(HANDLE hObject) { return TRUE; }
HANDLE CreateEventA(LPSECURITY_ATTRIBUTES lpEventAttributes, BOOL bManualReset, BOOL bInitialState, LPCSTR lpName) { return (HANDLE)1; }
BOOL SetEvent(HANDLE hEvent) { return TRUE; }
BOOL ResetEvent(HANDLE hEvent) { return TRUE; }
HANDLE CreateMutexA(LPSECURITY_ATTRIBUTES lpMutexAttributes, BOOL bInitialOwner, LPCSTR lpName) { return (HANDLE)1; }
HANDLE CreateThread(LPSECURITY_ATTRIBUTES lpThreadAttributes, SIZE_T dwStackSize, void* lpStartAddress,
                    LPVOID lpParameter, DWORD dwCreationFlags, LPDWORD lpThreadId) {
    if (lpThreadId) *lpThreadId = 1;
    return (HANDLE)1;
}
BOOL TerminateThread(HANDLE hThread, DWORD dwExitCode) { return TRUE; }
void ExitProcess(UINT uExitCode) {}
void InitializeCriticalSection(LPCRITICAL_SECTION lpCriticalSection) {}
void EnterCriticalSection(LPCRITICAL_SECTION lpCriticalSection) {}
void LeaveCriticalSection(LPCRITICAL_SECTION lpCriticalSection) {}
void DeleteCriticalSection(LPCRITICAL_SECTION lpCriticalSection) {}

BOOL DeleteFileA(LPCSTR lpFileName) { return TRUE; }
BOOL CopyFileA(LPCSTR lpExistingFileName, LPCSTR lpNewFileName, BOOL bFailIfExists) { return TRUE; }
BOOL MoveFileA(LPCSTR lpExistingFileName, LPCSTR lpNewFileName) { return TRUE; }
BOOL SetFileAttributesA(LPCSTR lpFileName, DWORD dwFileAttributes) { return TRUE; }
DWORD GetFileAttributesA(LPCSTR lpFileName) { return FILE_ATTRIBUTE_NORMAL; }
BOOL CreateDirectoryA(LPCSTR lpPathName, LPSECURITY_ATTRIBUTES lpSecurityAttributes) { return TRUE; }
BOOL RemoveDirectoryA(LPCSTR lpPathName) { return TRUE; }
HANDLE FindFirstFileA(LPCSTR lpFileName, LPWIN32_FIND_DATA lpFindFileData) { return INVALID_HANDLE_VALUE; }
BOOL FindNextFileA(HANDLE hFindFile, LPWIN32_FIND_DATA lpFindFileData) { return FALSE; }
BOOL FindClose(HANDLE hFindFile) { return TRUE; }

HANDLE CreateFileA(LPCSTR lpFileName, DWORD dwDesiredAccess, DWORD dwShareMode, LPSECURITY_ATTRIBUTES lpSecurityAttributes,
                   DWORD dwCreationDisposition, DWORD dwFlagsAndAttributes, HANDLE hTemplateFile) {
    const char* mode = (dwDesiredAccess & GENERIC_WRITE) ? "wb" : "rb";
    FILE* fp = __wrap_fopen(lpFileName, mode);
    if (!fp) return INVALID_HANDLE_VALUE;
    return (HANDLE)fp;
}
BOOL ReadFile(HANDLE hFile, LPVOID lpBuffer, DWORD nNumberOfBytesToRead, LPDWORD lpNumberOfBytesRead, void* lpOverlapped) {
    if (!hFile || hFile == INVALID_HANDLE_VALUE) return FALSE;
    size_t r = fread(lpBuffer, 1, nNumberOfBytesToRead, (FILE*)hFile);
    if (lpNumberOfBytesRead) *lpNumberOfBytesRead = (DWORD)r;
    return TRUE;
}
BOOL WriteFile(HANDLE hFile, LPCVOID lpBuffer, DWORD nNumberOfBytesToWrite, LPDWORD lpNumberOfBytesWritten, void* lpOverlapped) {
    if (!hFile || hFile == INVALID_HANDLE_VALUE) return FALSE;
    size_t w = fwrite(lpBuffer, 1, nNumberOfBytesToWrite, (FILE*)hFile);
    if (lpNumberOfBytesWritten) *lpNumberOfBytesWritten = (DWORD)w;
    return TRUE;
}
DWORD SetFilePointer(HANDLE hFile, LONG lDistanceToMove, PLONG lpDistanceToMoveHigh, DWORD dwMoveMethod) {
    if (!hFile || hFile == INVALID_HANDLE_VALUE) return (DWORD)-1;
    fseek((FILE*)hFile, lDistanceToMove, (int)dwMoveMethod);
    return (DWORD)ftell((FILE*)hFile);
}
DWORD GetFileSize(HANDLE hFile, LPDWORD lpFileSizeHigh) {
    if (lpFileSizeHigh) *lpFileSizeHigh = 0;
    if (!hFile || hFile == INVALID_HANDLE_VALUE) return 0;
    FILE* fp = (FILE*)hFile;
    long cur = ftell(fp);
    fseek(fp, 0, SEEK_END);
    long sz = ftell(fp);
    fseek(fp, cur, SEEK_SET);
    return (DWORD)sz;
}

DWORD GetLastError(void) { return 0; }
void SetLastError(DWORD dwErrCode) {}
void OutputDebugStringA(LPCSTR lpOutputString) {}
void DebugBreak(void) {}
BOOL GetVersionExA(LPOSVERSIONINFO lpVersionInformation) { return TRUE; }

} // extern "C"
