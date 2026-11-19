#ifndef _WASM_COMPAT_DSOUND_H_
#define _WASM_COMPAT_DSOUND_H_
#include <windows.h>
#include <mmsystem.h>

#define DS_OK                           0
#define DSERR_BUFFERLOST                0x88780096L
#define DSERR_INVALIDPARAM              E_INVALIDARG
#define DSSCL_NORMAL                    0x00000001
#define DSSCL_PRIORITY                  0x00000002
#define DSSCL_EXCLUSIVE                 0x00000003
#define DSSCL_WRITEPRIMARY              0x00000004

#define DSBCAPS_PRIMARYBUFFER           0x00000001
#define DSBCAPS_STATIC                  0x00000002
#define DSBCAPS_LOCHARDWARE             0x00000004
#define DSBCAPS_LOCSOFTWARE             0x00000008
#define DSBCAPS_CTRL3D                  0x00000010
#define DSBCAPS_CTRLFREQUENCY           0x00000020
#define DSBCAPS_CTRLPAN                 0x00000040
#define DSBCAPS_CTRLVOLUME              0x00000080
#define DSBCAPS_CTRLDEFAULT             0x000000E0
#define DSBCAPS_GLOBALFOCUS             0x00008000
#define DSBCAPS_GETCURRENTPOSITION2     0x00010000
#define DSBCAPS_MUTE3DATMAXDISTANCE     0x00020000

#define DSBPLAY_LOOPING                 0x00000001
#define DSBSTATUS_PLAYING               0x00000001
#define DSBSTATUS_BUFFERLOST            0x00000002
#define DSBSTATUS_LOOPING               0x00000004

#define DSBPAN_LEFT                     (-10000)
#define DSBPAN_CENTER                   0
#define DSBPAN_RIGHT                    10000
#define DSBVOLUME_MIN                   (-10000)
#define DSBVOLUME_MAX                   0

typedef float D3DVALUE, *LPD3DVALUE;

typedef struct _DSBUFFERDESC {
    DWORD dwSize;
    DWORD dwFlags;
    DWORD dwBufferBytes;
    DWORD dwReserved;
    LPWAVEFORMATEX lpwfxFormat;
} DSBUFFERDESC, *LPDSBUFFERDESC;
typedef const DSBUFFERDESC* LPCDSBUFFERDESC;

struct IDirectSound3DBuffer {
    virtual HRESULT Release() { return DS_OK; }
    virtual HRESULT SetPosition(D3DVALUE, D3DVALUE, D3DVALUE, DWORD) { return DS_OK; }
};
typedef IDirectSound3DBuffer* LPDIRECTSOUND3DBUFFER;

struct IDirectSound3DListener {
    virtual HRESULT Release() { return DS_OK; }
    virtual HRESULT SetPosition(D3DVALUE, D3DVALUE, D3DVALUE, DWORD) { return DS_OK; }
    virtual HRESULT SetDopplerFactor(D3DVALUE, DWORD) { return DS_OK; }
    virtual HRESULT SetRolloffFactor(D3DVALUE, DWORD) { return DS_OK; }
    virtual HRESULT SetDistanceFactor(D3DVALUE, DWORD) { return DS_OK; }
    virtual HRESULT CommitDeferredSettings() { return DS_OK; }
};
typedef IDirectSound3DListener* LPDIRECTSOUND3DLISTENER;

struct IDirectSoundBuffer {
    DWORD m_status;
    LONG m_volume;
    LONG m_pan;
    int m_soundIndex;
    IDirectSoundBuffer() : m_status(0), m_volume(0), m_pan(0), m_soundIndex(-1) {}
    virtual ~IDirectSoundBuffer() {}
    virtual HRESULT Release() { return DS_OK; }
    virtual HRESULT Play(DWORD, DWORD, DWORD dwFlags);
    virtual HRESULT Stop();
    virtual HRESULT SetCurrentPosition(DWORD) { return DS_OK; }
    virtual HRESULT GetStatus(LPDWORD pdw) { if (pdw) *pdw = m_status; return DS_OK; }
    virtual HRESULT SetVolume(LONG v) { m_volume = v; return DS_OK; }
    virtual HRESULT GetVolume(LPLONG pv) { if (pv) *pv = m_volume; return DS_OK; }
    virtual HRESULT SetPan(LONG p) { m_pan = p; return DS_OK; }
    virtual HRESULT GetPan(LPLONG pp) { if (pp) *pp = m_pan; return DS_OK; }
    virtual HRESULT SetFrequency(DWORD) { return DS_OK; }
    virtual HRESULT Restore() { return DS_OK; }
    virtual HRESULT Lock(DWORD, DWORD, LPVOID*, LPDWORD, LPVOID*, LPDWORD, DWORD) { return DS_OK; }
    virtual HRESULT Unlock(LPVOID, DWORD, LPVOID, DWORD) { return DS_OK; }
    virtual HRESULT Initialize(struct IDirectSound*, LPCDSBUFFERDESC) { return DS_OK; }
    virtual HRESULT QueryInterface(const GUID*, LPVOID* ppv) { if (ppv) *ppv = new IDirectSound3DBuffer(); return DS_OK; }
    virtual HRESULT QueryInterface(REFGUID, LPVOID* ppv) { if (ppv) *ppv = new IDirectSound3DBuffer(); return DS_OK; }
};
typedef IDirectSoundBuffer* LPDIRECTSOUNDBUFFER;
typedef IDirectSoundBuffer** LPLPDIRECTSOUNDBUFFER;

struct IDirectSound {
    virtual HRESULT Release() { return DS_OK; }
    virtual HRESULT SetCooperativeLevel(HWND, DWORD) { return DS_OK; }
    virtual HRESULT CreateSoundBuffer(LPCDSBUFFERDESC, LPLPDIRECTSOUNDBUFFER ppBuf, void*) {
        if (ppBuf) *ppBuf = new IDirectSoundBuffer();
        return DS_OK;
    }
    virtual HRESULT DuplicateSoundBuffer(LPDIRECTSOUNDBUFFER pSrc, LPLPDIRECTSOUNDBUFFER ppDst) {
        if (ppDst) {
            IDirectSoundBuffer* b = new IDirectSoundBuffer();
            if (pSrc) b->m_soundIndex = pSrc->m_soundIndex;
            *ppDst = b;
        }
        return DS_OK;
    }
};
typedef IDirectSound* LPDIRECTSOUND;

inline HRESULT WINAPI DirectSoundCreate(GUID*, LPDIRECTSOUND* ppDS, void*) {
    if (ppDS) *ppDS = new IDirectSound();
    return DS_OK;
}


typedef struct _D3DVECTOR {
    float x;
    float y;
    float z;
} D3DVECTOR, *LPD3DVECTOR;
extern GUID IID_IDirectSound3DBuffer;
extern GUID IID_IDirectSound3DListener;
#define DS3D_IMMEDIATE 0x00000000
#define DS3D_DEFERRED  0x00000001
#define DS3D_DEFAULTDOPPLERFACTOR 1.0f
#define DS3D_DEFAULTROLLOFFFACTOR 1.0f
#define D3DVAL(val) ((float)(val))
#define IDirectSound_SetCooperativeLevel(p,a,b) ((p)->SetCooperativeLevel(a,b))
#define IDirectSound_CreateSoundBuffer(p,a,b,c) ((p)->CreateSoundBuffer(a,b,c))
#define IDirectSound_DuplicateSoundBuffer(p,a,b) ((p)->DuplicateSoundBuffer(a,b))
#define IDirectSoundBuffer_Lock(p,a,b,c,d,e,f,g) ((p)->Lock(a,b,c,d,e,f,g))
#define IDirectSoundBuffer_Unlock(p,a,b,c,d) ((p)->Unlock(a,b,c,d))
#define IDirectSoundBuffer_Restore(p) ((p)->Restore())
#define IDirectSoundBuffer_GetStatus(p,a) ((p)->GetStatus(a))
#define IDirectSoundBuffer_Play(p,a,b,c) ((p)->Play(a,b,c))
#define IDirectSoundBuffer_Stop(p) ((p)->Stop())
#define IDirectSoundBuffer_SetVolume(p,a) ((p)->SetVolume(a))
#define IDirectSoundBuffer_GetVolume(p,a) ((p)->GetVolume(a))
#define IDirectSoundBuffer_SetPan(p,a) ((p)->SetPan(a))
#define IDirectSoundBuffer_GetPan(p,a) ((p)->GetPan(a))
#define IDirectSoundBuffer_SetFrequency(p,a) ((p)->SetFrequency(a))
#define IDirectSoundBuffer_SetCurrentPosition(p,a) ((p)->SetCurrentPosition(a))
#define IDirectSound3DBuffer_SetPosition(p,a,b,c,d) ((p)->SetPosition(a,b,c,d))
#define IDirectSound3DBuffer_Release(p) ((p)->Release())
#define IDirectSound3DListener_SetPosition(p,a,b,c,d) ((p)->SetPosition(a,b,c,d))
#define IDirectSound3DListener_SetDopplerFactor(p,a,b) ((p)->SetDopplerFactor(a,b))
#define IDirectSound3DListener_SetRolloffFactor(p,a,b) ((p)->SetRolloffFactor(a,b))
#define IDirectSound3DListener_SetDistanceFactor(p,a,b) ((p)->SetDistanceFactor(a,b))
#define IDirectSound3DListener_CommitDeferredSettings(p) ((p)->CommitDeferredSettings())
#define IDirectSound3DListener_Release(p) ((p)->Release())

#define IDirectSoundBuffer_Release(p) ((p)->Release())
#define IDirectSound_Release(p) ((p)->Release())
#endif
