#ifndef _WASM_COMPAT_MMSYSTEM_H_
#define _WASM_COMPAT_MMSYSTEM_H_
#include <windows.h>

typedef UINT MMRESULT;
typedef DWORD FOURCC;
typedef char* HPSTR;

#define TIMERR_NOERROR 0
#define MMSYSERR_NOERROR 0

#ifndef WAVE_FORMAT_PCM
#define WAVE_FORMAT_PCM 1
typedef struct tWAVEFORMATEX {
    WORD  wFormatTag;
    WORD  nChannels;
    DWORD nSamplesPerSec;
    DWORD nAvgBytesPerSec;
    WORD  nBlockAlign;
    WORD  wBitsPerSample;
    WORD  cbSize;
} WAVEFORMATEX, *PWAVEFORMATEX, *LPWAVEFORMATEX;
typedef const WAVEFORMATEX* LPCWAVEFORMATEX;

typedef struct waveformat_tag {
    WORD  wFormatTag;
    WORD  nChannels;
    DWORD nSamplesPerSec;
    DWORD nAvgBytesPerSec;
    WORD  nBlockAlign;
} WAVEFORMAT, *PWAVEFORMAT, *LPWAVEFORMAT;

typedef struct pcmwaveformat_tag {
    WAVEFORMAT wf;
    WORD       wBitsPerSample;
} PCMWAVEFORMAT, *PPCMWAVEFORMAT, *LPPCMWAVEFORMAT;
#endif

typedef struct timecaps_tag {
    UINT wPeriodMin;
    UINT wPeriodMax;
} TIMECAPS, *PTIMECAPS, *LPTIMECAPS;

typedef struct _MMCKINFO {
    FOURCC ckid;
    DWORD  cksize;
    FOURCC fccType;
    DWORD  dwDataOffset;
    DWORD  dwFlags;
} MMCKINFO, *PMMCKINFO, *LPMMCKINFO;

typedef struct _MMIOINFO {
    DWORD      dwFlags;
    FOURCC     fccIOProc;
    void*      pIOProc;
    UINT       wErrorRet;
    HANDLE     htask;
    LONG       cchBuffer;
    LPSTR      pchBuffer;
    LPSTR      pchNext;
    LPSTR      pchEndRead;
    LPSTR      pchEndWrite;
    LONG       lBufOffset;
    LONG       lDiskOffset;
    DWORD      adwInfo[3];
    DWORD      dwReserved1;
    DWORD      dwReserved2;
    HMMIO      hmmio;
} MMIOINFO, *PMMIOINFO, *LPMMIOINFO;

#define MMIO_READ       0x00000000
#define MMIO_ALLOCBUF   0x00010000
#define MMIO_FINDRIFF   0x00000020
#define MMIO_FINDCHUNK  0x00000010
#define mmioFOURCC(ch0, ch1, ch2, ch3) ((DWORD)(BYTE)(ch0) | ((DWORD)(BYTE)(ch1) << 8) | ((DWORD)(BYTE)(ch2) << 16) | ((DWORD)(BYTE)(ch3) << 24))
#define FOURCC_RIFF mmioFOURCC('R','I','F','F')

typedef DWORD MCIERROR;
typedef UINT MCIDEVICEID;
typedef struct tagMCI_GENERIC_PARMS {
    DWORD_PTR dwCallback;
} MCI_GENERIC_PARMS, *PMCI_GENERIC_PARMS, *LPMCI_GENERIC_PARMS;

typedef struct tagMCI_OPEN_PARMSA {
    DWORD_PTR   dwCallback;
    MCIDEVICEID wDeviceID;
    LPCSTR      lpstrDeviceType;
    LPCSTR      lpstrElementName;
    LPCSTR      lpstrAlias;
} MCI_OPEN_PARMSA, MCI_OPEN_PARMS, *PMCI_OPEN_PARMS, *LPMCI_OPEN_PARMS;

typedef struct tagMCI_PLAY_PARMS {
    DWORD_PTR dwCallback;
    DWORD     dwFrom;
    DWORD     dwTo;
} MCI_PLAY_PARMS, *PMCI_PLAY_PARMS, *LPMCI_PLAY_PARMS;

typedef struct tagMCI_STATUS_PARMS {
    DWORD_PTR dwCallback;
    DWORD_PTR dwReturn;
    DWORD     dwItem;
    DWORD     dwTrack;
} MCI_STATUS_PARMS, *PMCI_STATUS_PARMS, *LPMCI_STATUS_PARMS;

#define MCI_OPEN                0x0803
#define MCI_CLOSE               0x0804
#define MCI_PLAY                0x0806
#define MCI_STOP                0x0808
#define MCI_PAUSE               0x0809
#define MCI_STATUS              0x0814
#define MCI_NOTIFY              0x00000001L
#define MCI_WAIT                0x00000002L
#define MCI_FROM                0x00000004L
#define MCI_TO                  0x00000008L
#define MCI_OPEN_TYPE           0x00002000L
#define MCI_OPEN_ELEMENT        0x00000200L
#define MCI_STATUS_ITEM         0x00000100L
#define MCI_STATUS_MODE         0x00000004L
#define MCI_MODE_NOT_READY      524
#define MCI_MODE_STOP           525
#define MCI_MODE_PLAY           526
#define MCI_MODE_RECORD         527
#define MCI_MODE_SEEK           528
#define MCI_MODE_PAUSE          529
#define MCI_MODE_OPEN           530
#define MM_MCINOTIFY            0x03B9
#define MCI_NOTIFY_SUCCESSFUL   0x0001
#define MCI_NOTIFY_SUPERSEDED   0x0002
#define MCI_NOTIFY_ABORTED      0x0004
#define MCI_NOTIFY_FAILURE      0x0008

#ifdef __cplusplus
extern "C" {
#endif
MMRESULT WINAPI timeBeginPeriod(UINT uPeriod);
MMRESULT WINAPI timeEndPeriod(UINT uPeriod);
MMRESULT WINAPI timeGetDevCaps(LPTIMECAPS ptc, UINT cbtc);

inline MCIERROR WINAPI mciSendCommandA(MCIDEVICEID, UINT, DWORD_PTR, DWORD_PTR) { return 0; }
inline BOOL WINAPI mciGetErrorStringA(MCIERROR, LPSTR lpText, UINT cchText) { if (lpText && cchText > 0) lpText[0] = 0; return TRUE; }
inline MCIERROR WINAPI mciSendStringA(LPCSTR, LPSTR, UINT, HWND) { return 0; }
#define mciSendCommand mciSendCommandA
#define mciGetErrorString mciGetErrorStringA
#define mciSendString mciSendStringA

inline HMMIO WINAPI mmioOpenA(LPSTR, LPMMIOINFO, DWORD) { return NULL; }
inline MMRESULT WINAPI mmioClose(HMMIO, UINT) { return 0; }
inline LONG WINAPI mmioRead(HMMIO, char*, LONG) { return -1; }
inline LONG WINAPI mmioSeek(HMMIO, LONG, int) { return -1; }
inline MMRESULT WINAPI mmioDescend(HMMIO, LPMMCKINFO, const MMCKINFO*, UINT) { return 1; }
inline MMRESULT WINAPI mmioAscend(HMMIO, LPMMCKINFO, UINT) { return 0; }
#define mmioOpen mmioOpenA
inline MMRESULT WINAPI mmioGetInfo(HMMIO, LPMMIOINFO, UINT) { return 1; }
inline MMRESULT WINAPI mmioSetInfo(HMMIO, const MMIOINFO*, UINT) { return 0; }
inline MMRESULT WINAPI mmioAdvance(HMMIO, LPMMIOINFO, UINT) { return 1; }
#ifdef __cplusplus
}
#endif

#endif
