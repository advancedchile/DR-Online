#ifndef _WASM_COMPAT_DDRAW_H_
#define _WASM_COMPAT_DDRAW_H_
#include <windows.h>

#define DD_OK 0
#define DDPF_RGB 0x00000040L
#define DDERR_GENERIC                   E_FAIL
#define DDERR_SURFACELOST               0x887601C2L
#define DDERR_WASSTILLDRAWING           0x8876021CL
#define DDERR_INVALIDPARAMS             E_INVALIDARG

#define DDSCL_FULLSCREEN                0x00000001L
#define DDSCL_ALLOWREBOOT               0x00000002L
#define DDSCL_NOWINDOWCHANGES           0x00000004L
#define DDSCL_NORMAL                    0x00000008L
#define DDSCL_EXCLUSIVE                 0x00000010L
#define DDSCL_ALLOWMODEX                0x00000040L

#define DDSD_CAPS                       0x00000001L
#define DDSD_HEIGHT                     0x00000002L
#define DDSD_WIDTH                      0x00000004L
#define DDSD_PITCH                      0x00000008L
#define DDSD_BACKBUFFERCOUNT            0x00000020L
#define DDSD_CKSRCBLT                   0x00010000L
#define DDSD_PIXELFORMAT                0x00001000L

#define DDSCAPS_PRIMARYSURFACE          0x00000200L
#define DDSCAPS_BACKBUFFER              0x00000004L
#define DDSCAPS_FLIP                    0x00000010L
#define DDSCAPS_COMPLEX                 0x00000008L
#define DDSCAPS_OFFSCREENPLAIN          0x00000040L
#define DDSCAPS_SYSTEMMEMORY            0x00000800L
#define DDSCAPS_VIDEOMEMORY             0x00004000L

#define DDLOCK_WAIT                     0x00000001L
#define DDLOCK_SURFACEMEMORYPTR         0x00000000L
#define DDLOCK_READONLY                 0x00000010L
#define DDLOCK_WRITEONLY                0x00000020L

#define DDBLT_WAIT                      0x01000000L
#define DDBLT_COLORFILL                 0x00000400L
#define DDBLT_KEYSRC                    0x00008000L
#define DDBLT_DDFX                      0x00000800L
#define DDCOLOR_BRIGHTNESS              0x00000001L
#define DDCOLOR_CONTRAST                0x00000002L
#define DDCOLOR_HUE                     0x00000004L
#define DDCOLOR_SATURATION              0x00000008L
#define DDCOLOR_SHARPNESS               0x00000010L
#define DDCOLOR_GAMMA                   0x00000020L
#define DDCOLOR_COLORENABLE             0x00000040L

typedef struct _DDCOLORCONTROL {
    DWORD dwSize;
    DWORD dwFlags;
    LONG  lBrightness;
    LONG  lContrast;
    LONG  lHue;
    LONG  lSaturation;
    LONG  lSharpness;
    LONG  lGamma;
    LONG  lColorEnable;
    DWORD dwReserved1;
} DDCOLORCONTROL, *LPDDCOLORCONTROL;

#define DDBLTFAST_NOCOLORKEY            0x00000000
#define DDBLTFAST_SRCCOLORKEY           0x00000001
#define DDBLTFAST_DESTCOLORKEY          0x00000002
#define DDBLTFAST_WAIT                  0x00000010

#define DDFLIP_WAIT                     0x00000001L
#define DDCKEY_SRCBLT                   0x00000008L
#define DDWAITVB_BLOCKBEGIN             0x00000001L

typedef struct _DDCOLORKEY {
    DWORD dwColorSpaceLowValue;
    DWORD dwColorSpaceHighValue;
} DDCOLORKEY, *LPDDCOLORKEY;

typedef struct _DDPIXELFORMAT {
    DWORD dwSize;
    DWORD dwFlags;
    DWORD dwFourCC;
    union {
        DWORD dwRGBBitCount;
        DWORD dwYUVBitCount;
        DWORD dwZBufferBitDepth;
        DWORD dwAlphaBitDepth;
    };
    union {
        DWORD dwRBitMask;
        DWORD dwYBitMask;
    };
    union {
        DWORD dwGBitMask;
        DWORD dwUBitMask;
    };
    union {
        DWORD dwBBitMask;
        DWORD dwVBitMask;
    };
    union {
        DWORD dwRGBAlphaBitMask;
        DWORD dwYUVAlphaBitMask;
    };
} DDPIXELFORMAT, *LPDDPIXELFORMAT;

typedef struct _DDSCAPS {
    DWORD dwCaps;
} DDSCAPS, *LPDDSCAPS;

typedef struct _DDSURFACEDESC {
    DWORD dwSize;
    DWORD dwFlags;
    DWORD dwHeight;
    DWORD dwWidth;
    union {
        LONG  lPitch;
        DWORD dwLinearSize;
    };
    DWORD dwBackBufferCount;
    union {
        DWORD dwMipMapCount;
        DWORD dwZBufferBitDepth;
        DWORD dwRefreshRate;
    };
    DWORD dwAlphaBitDepth;
    DWORD dwReserved;
    LPVOID lpSurface;
    DDCOLORKEY ddckCKDestOverlay;
    DDCOLORKEY ddckCKDestBlt;
    DDCOLORKEY ddckCKSrcOverlay;
    DDCOLORKEY ddckCKSrcBlt;
    DDPIXELFORMAT ddpfPixelFormat;
    DDSCAPS ddsCaps;
} DDSURFACEDESC, *LPDDSURFACEDESC;

typedef struct _DDBLTFX {
    DWORD dwSize;
    DWORD dwDDFX;
    DWORD dwROP;
    DWORD dwDDROP;
    DWORD dwRotationAngle;
    DWORD dwZBufferOpCode;
    DWORD dwZBufferLow;
    DWORD dwZBufferHigh;
    DWORD dwZBufferBaseDest;
    DWORD dwZDestConstBitDepth;
    DWORD dwZSrcConstBitDepth;
    DWORD dwAlphaEdgeBlendBitDepth;
    DWORD dwAlphaEdgeBlend;
    DWORD dwReserved;
    DWORD dwAlphaDestConstBitDepth;
    DWORD dwAlphaSrcConstBitDepth;
    DWORD dwFillColor;
    DDCOLORKEY ddckDestColorkey;
    DDCOLORKEY ddckSrcColorkey;
} DDBLTFX, *LPDDBLTFX;

struct IDirectDrawClipper {
    virtual HRESULT Release() { return DD_OK; }
    virtual HRESULT SetHWnd(DWORD, HWND) { return DD_OK; }
    virtual HRESULT SetClipList(LPRGNDATA, DWORD) { return DD_OK; }
};
struct IDirectDrawColorControl {
    virtual HRESULT Release() { return DD_OK; }
};
typedef IDirectDrawColorControl* LPDIRECTDRAWCOLORCONTROL;

typedef IDirectDrawClipper* LPDIRECTDRAWCLIPPER;

struct IDirectDrawPalette {
    virtual HRESULT Release() { return DD_OK; }
};
typedef IDirectDrawPalette* LPDIRECTDRAWPALETTE;

struct IDirectDrawSurface {
    uint16_t* m_buffer;
    int m_width;
    int m_height;
    DWORD m_colorKey;

    IDirectDrawSurface(int w = 800, int h = 600) : m_width(w), m_height(h), m_colorKey(0) {
        m_buffer = (uint16_t*)calloc(w * h, sizeof(uint16_t));
    }
    virtual ~IDirectDrawSurface() {
        if (m_buffer) free(m_buffer);
    }
    virtual HRESULT Release() { return DD_OK; }
    virtual HRESULT GetAttachedSurface(LPDDSCAPS, IDirectDrawSurface** ppSurf) {
        *ppSurf = this;
        return DD_OK;
    }
    virtual HRESULT Lock(LPRECT, LPDDSURFACEDESC lpDesc, DWORD, HANDLE) {
        if (lpDesc) {
            lpDesc->lpSurface = m_buffer;
            lpDesc->lPitch = m_width * 2;
            lpDesc->dwWidth = m_width;
            lpDesc->dwHeight = m_height;
            lpDesc->ddpfPixelFormat.dwRGBBitCount = 16;
            lpDesc->ddpfPixelFormat.dwRBitMask = 0xF800;
            lpDesc->ddpfPixelFormat.dwGBitMask = 0x07E0;
            lpDesc->ddpfPixelFormat.dwBBitMask = 0x001F;
        }
        return DD_OK;
    }
    virtual HRESULT Unlock(LPVOID) { return DD_OK; }
    virtual HRESULT Flip(IDirectDrawSurface*, DWORD) { return DD_OK; }
    virtual HRESULT Blt(LPRECT lpDestRect, IDirectDrawSurface* lpSrc, LPRECT lpSrcRect, DWORD dwFlags, LPDDBLTFX lpDDBltFx) {
        if ((dwFlags & DDBLT_COLORFILL) && lpDDBltFx && m_buffer) {
            uint16_t fill = (uint16_t)lpDDBltFx->dwFillColor;
            int x0 = lpDestRect ? lpDestRect->left : 0;
            int y0 = lpDestRect ? lpDestRect->top : 0;
            int x1 = lpDestRect ? lpDestRect->right : m_width;
            int y1 = lpDestRect ? lpDestRect->bottom : m_height;
            if (x0 < 0) x0 = 0; if (y0 < 0) y0 = 0;
            if (x1 > m_width) x1 = m_width; if (y1 > m_height) y1 = m_height;
            for (int y = y0; y < y1; y++) {
                uint16_t* row = m_buffer + y * m_width;
                for (int x = x0; x < x1; x++) row[x] = fill;
            }
        }
        return DD_OK;
    }
    virtual HRESULT BltFast(DWORD x, DWORD y, IDirectDrawSurface* lpSrc, LPRECT lpSrcRect, DWORD dwTrans) {
        if (!lpSrc || !lpSrc->m_buffer || !m_buffer) return DD_OK;
        int sx0 = lpSrcRect ? lpSrcRect->left : 0;
        int sy0 = lpSrcRect ? lpSrcRect->top : 0;
        int sx1 = lpSrcRect ? lpSrcRect->right : lpSrc->m_width;
        int sy1 = lpSrcRect ? lpSrcRect->bottom : lpSrc->m_height;
        int w = sx1 - sx0;
        int h = sy1 - sy0;
        for (int row = 0; row < h; row++) {
            int dy = (int)y + row;
            int sy = sy0 + row;
            if (dy < 0 || dy >= m_height || sy < 0 || sy >= lpSrc->m_height) continue;
            for (int col = 0; col < w; col++) {
                int dx = (int)x + col;
                int sx = sx0 + col;
                if (dx < 0 || dx >= m_width || sx < 0 || sx >= lpSrc->m_width) continue;
                uint16_t px = lpSrc->m_buffer[sy * lpSrc->m_width + sx];
                if ((dwTrans & DDBLTFAST_SRCCOLORKEY) && px == (uint16_t)lpSrc->m_colorKey) continue;
                m_buffer[dy * m_width + dx] = px;
            }
        }
        return DD_OK;
    }
    virtual HRESULT GetDC(HDC* lphDC) {
        if (lphDC) *lphDC = (HDC)(intptr_t)1;
        return DD_OK;
    }
    virtual HRESULT ReleaseDC(HDC) { return DD_OK; }
    virtual HRESULT Restore() { return DD_OK; }
    virtual HRESULT IsLost() { return DD_OK; }
    virtual HRESULT SetClipper(LPDIRECTDRAWCLIPPER) { return DD_OK; }
    virtual HRESULT SetColorKey(DWORD, LPDDCOLORKEY lpKey) {
        if (lpKey) m_colorKey = lpKey->dwColorSpaceLowValue;
        return DD_OK;
    }
    virtual HRESULT GetPixelFormat(LPDDPIXELFORMAT lpPf) {
        if (lpPf) {
            lpPf->dwRGBBitCount = 16;
            lpPf->dwRBitMask = 0xF800;
            lpPf->dwGBitMask = 0x07E0;
            lpPf->dwBBitMask = 0x001F;
        }
        return DD_OK;
    }
    virtual HRESULT GetSurfaceDesc(LPDDSURFACEDESC lpDesc) {
        return Lock(NULL, lpDesc, 0, NULL);
    }
};
typedef IDirectDrawSurface* LPDIRECTDRAWSURFACE;

struct IDirectDraw {
    virtual HRESULT Release() { return DD_OK; }
    virtual HRESULT SetCooperativeLevel(HWND, DWORD) { return DD_OK; }
    virtual HRESULT SetDisplayMode(DWORD, DWORD, DWORD) { return DD_OK; }
    virtual HRESULT RestoreDisplayMode() { return DD_OK; }
    virtual HRESULT CreateSurface(LPDDSURFACEDESC lpDesc, LPDIRECTDRAWSURFACE* ppSurf, void*) {
        int w = (lpDesc && (lpDesc->dwFlags & DDSD_WIDTH) && lpDesc->dwWidth > 0) ? lpDesc->dwWidth : 800;
        int h = (lpDesc && (lpDesc->dwFlags & DDSD_HEIGHT) && lpDesc->dwHeight > 0) ? lpDesc->dwHeight : 600;
        *ppSurf = new IDirectDrawSurface(w, h);
        return DD_OK;
    }
    virtual HRESULT CreateClipper(DWORD, LPDIRECTDRAWCLIPPER* ppClipper, void*) {
        *ppClipper = new IDirectDrawClipper();
        return DD_OK;
    }
    virtual HRESULT WaitForVerticalBlank(DWORD, HANDLE) { return DD_OK; }
    virtual HRESULT FlipToGDISurface() { return DD_OK; }
};
typedef IDirectDraw* LPDIRECTDRAW;

inline HRESULT WINAPI DirectDrawCreate(GUID*, LPDIRECTDRAW* lplpDD, void*) {
    if (lplpDD) *lplpDD = new IDirectDraw();
    return DD_OK;
}

#endif
