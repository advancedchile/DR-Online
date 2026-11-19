#ifndef _WASM_COMPAT_WINDOWS_H_
#define _WASM_COMPAT_WINDOWS_H_
#ifndef STRICT
#define STRICT 1
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <stdint.h>
#include <ctype.h>
#include <math.h>
#include <time.h>
#include <errno.h>
#include <sys/stat.h>

#ifdef __cplusplus
#include <algorithm>
#endif

#ifndef WINAPI
#define WINAPI
#endif
#ifndef CALLBACK
#define CALLBACK
#endif
#ifndef APIENTRY
#define APIENTRY
#endif
#ifndef PASCAL
#define PASCAL
#endif
#ifndef FAR
#define FAR
#endif
#ifndef NEAR
#define NEAR
#endif
#ifndef CDECL
#define CDECL
#endif
#ifndef STDMETHODCALLTYPE
#define STDMETHODCALLTYPE
#endif
#ifndef FASTCALL
#define FASTCALL
#endif
#ifndef CONST
#define CONST const
#endif
#ifndef IN
#define IN
#endif
#ifndef OUT
#define OUT
#endif
#ifndef OPTIONAL
#define OPTIONAL
#endif

#ifndef __MSC_VER
#ifndef _MSC_VER
/* Clang -fms-extensions provides __int8, __int16, __int32, __int64 built-in */
#endif
#endif

typedef void VOID;
typedef void* LPVOID;
typedef const void* LPCVOID;
typedef void* PVOID;
typedef int BOOL;
typedef int* LPBOOL;
typedef int* PBOOL;
typedef uint8_t BYTE;
typedef uint8_t* LPBYTE;
typedef uint8_t* PBYTE;
typedef uint16_t WORD;
typedef uint16_t* LPWORD;
typedef uint16_t* PWORD;
typedef uint32_t DWORD;
typedef uint32_t* LPDWORD;
typedef uint32_t* PDWORD;
typedef int32_t LONG;
typedef int32_t* LPLONG;
typedef int32_t* PLONG;
typedef uint32_t ULONG;
typedef uint32_t* PULONG;
typedef int16_t SHORT;
typedef uint16_t USHORT;
typedef USHORT* PUSHORT;
typedef int INT;
typedef int* LPINT;
typedef int* PINT;
typedef unsigned int UINT;
typedef unsigned int* PUINT;
typedef unsigned int* LPUINT;
typedef char CHAR;
typedef unsigned char UCHAR;
typedef UCHAR* PUCHAR;
typedef wchar_t WCHAR;
typedef char TCHAR;
typedef float FLOAT;
typedef FLOAT* PFLOAT;
typedef double DOUBLE;
typedef int64_t LONGLONG;
typedef uint64_t ULONGLONG;
typedef int64_t INT64;
typedef uint64_t UINT64;

typedef char* LPSTR;
typedef const char* LPCSTR;
typedef char* PSTR;
typedef const char* PCSTR;
typedef char* LPTSTR;
typedef const char* LPCTSTR;
typedef char* PTSTR;
typedef const char* PCTSTR;
typedef wchar_t* LPWSTR;
typedef const wchar_t* LPCWSTR;

typedef uintptr_t ULONG_PTR;
typedef intptr_t LONG_PTR;
typedef uintptr_t DWORD_PTR;
typedef uintptr_t UINT_PTR;
typedef intptr_t INT_PTR;
typedef size_t SIZE_T;

typedef LONG_PTR LRESULT;
typedef UINT_PTR WPARAM;
typedef LONG_PTR LPARAM;
typedef int32_t HRESULT;
typedef uint32_t COLORREF;
typedef uint16_t ATOM;

typedef void* HANDLE;
typedef HANDLE* PHANDLE;
typedef HANDLE* LPHANDLE;
typedef HANDLE HWND;
typedef HANDLE HINSTANCE;
typedef HANDLE HMODULE;
typedef HANDLE HDC;
typedef HANDLE HGDIOBJ;
typedef HANDLE HFONT;
typedef HANDLE HBRUSH;
typedef HANDLE HPEN;
typedef HANDLE HBITMAP;
typedef HANDLE HPALETTE;
typedef HANDLE HRGN;
typedef HANDLE HICON;
typedef HANDLE HCURSOR;
typedef HANDLE HMENU;
typedef HANDLE HACCEL;
typedef HANDLE HGLOBAL;
typedef HANDLE HLOCAL;
typedef HANDLE HKEY;
typedef HKEY* PHKEY;
typedef HANDLE HIMC;
typedef HANDLE HKL;
typedef HANDLE HWAVEOUT;
typedef HANDLE HMMIO;
typedef HANDLE HHOOK;
typedef HANDLE HDROP;

typedef LRESULT (CALLBACK* WNDPROC)(HWND, UINT, WPARAM, LPARAM);
typedef INT_PTR (CALLBACK* DLGPROC)(HWND, UINT, WPARAM, LPARAM);
typedef LRESULT (*FARPROC)();

#ifndef TRUE
#define TRUE 1
#endif
#ifndef FALSE
#define FALSE 0
#endif

#ifndef MAX_PATH
#define MAX_PATH 260
#endif
#ifndef _MAX_PATH
#define _MAX_PATH 260
#define _MAX_DRIVE 3
#define _MAX_DIR 256
#define _MAX_FNAME 256
#define _MAX_EXT 256
#endif

#define INVALID_HANDLE_VALUE ((HANDLE)(intptr_t)-1)
#define INVALID_FILE_SIZE ((DWORD)0xFFFFFFFF)

#define S_OK ((HRESULT)0L)
#define S_FALSE ((HRESULT)1L)
#define E_FAIL ((HRESULT)0x80004005L)
#define E_INVALIDARG ((HRESULT)0x80070057L)
#define E_OUTOFMEMORY ((HRESULT)0x8007000EL)
#define E_NOTIMPL ((HRESULT)0x80004001L)
#define E_NOINTERFACE ((HRESULT)0x80004002L)
#define E_POINTER ((HRESULT)0x80004003L)
#define SUCCEEDED(hr) (((HRESULT)(hr)) >= 0)
#define FAILED(hr) (((HRESULT)(hr)) < 0)

#define LOWORD(l) ((WORD)(((DWORD_PTR)(l)) & 0xffff))
#define HIWORD(l) ((WORD)((((DWORD_PTR)(l)) >> 16) & 0xffff))
#define LOBYTE(w) ((BYTE)(((DWORD_PTR)(w)) & 0xff))
#define HIBYTE(w) ((BYTE)((((DWORD_PTR)(w)) >> 8) & 0xff))
#define MAKELONG(a, b) ((LONG)(((WORD)(((DWORD_PTR)(a)) & 0xffff)) | ((DWORD)((WORD)(((DWORD_PTR)(b)) & 0xffff))) << 16))
#define MAKEWORD(a, b) ((WORD)(((BYTE)(((DWORD_PTR)(a)) & 0xff)) | ((WORD)((BYTE)(((DWORD_PTR)(b)) & 0xff))) << 8))
#define MAKEWPARAM(l, h) ((WPARAM)(DWORD)MAKELONG(l, h))
#define MAKELPARAM(l, h) ((LPARAM)(DWORD)MAKELONG(l, h))
#define MAKELRESULT(l, h) ((LRESULT)(DWORD)MAKELONG(l, h))

#define RGB(r,g,b) ((COLORREF)(((BYTE)(r)|((WORD)((BYTE)(g))<<8))|(((DWORD)(BYTE)(b))<<16)))
#define GetRValue(rgb) (LOBYTE(rgb))
#define GetGValue(rgb) (LOBYTE(((WORD)(rgb)) >> 8))
#define GetBValue(rgb) (LOBYTE((rgb)>>16))

#define ZeroMemory(Destination,Length) memset((Destination),0,(Length))
#define CopyMemory(Destination,Source,Length) memcpy((Destination),(Source),(Length))
#define MoveMemory(Destination,Source,Length) memmove((Destination),(Source),(Length))
#define FillMemory(Destination,Length,Fill) memset((Destination),(Fill),(Length))

#define TEXT(quote) quote
#define _T(quote) quote

typedef union _LARGE_INTEGER {
    struct {
        DWORD LowPart;
        LONG HighPart;
    };
    struct {
        DWORD LowPart;
        LONG HighPart;
    } u;
    LONGLONG QuadPart;
} LARGE_INTEGER, *PLARGE_INTEGER;

typedef union _ULARGE_INTEGER {
    struct {
        DWORD LowPart;
        DWORD HighPart;
    };
    struct {
        DWORD LowPart;
        DWORD HighPart;
    } u;
    ULONGLONG QuadPart;
} ULARGE_INTEGER, *PULARGE_INTEGER;

typedef struct _GUID {
    uint32_t Data1;
    uint16_t Data2;
    uint16_t Data3;
    uint8_t  Data4[8];
} GUID, IID, CLSID, *LPGUID;
#ifdef __cplusplus
typedef const GUID& REFGUID;
typedef const IID& REFIID;
typedef const CLSID& REFCLSID;
#else
typedef const GUID* REFGUID;
typedef const IID* REFIID;
typedef const CLSID* REFCLSID;
#endif

#ifdef __cplusplus
inline bool operator==(const GUID& a, const GUID& b) {
    return memcmp(&a, &b, sizeof(GUID)) == 0;
}
inline bool operator!=(const GUID& a, const GUID& b) {
    return memcmp(&a, &b, sizeof(GUID)) != 0;
}
#endif

typedef struct tagPOINT {
    LONG x;
    LONG y;
} POINT, *PPOINT, *LPPOINT;

typedef struct tagRECT {
    LONG left;
    LONG top;
    LONG right;
    LONG bottom;
} RECT, *PRECT, *LPRECT;
typedef const RECT* LPCRECT;

typedef struct tagSIZE {
    LONG cx;
    LONG cy;
} SIZE, *PSIZE, *LPSIZE;

typedef struct tagMSG {
    HWND hwnd;
    UINT message;
    WPARAM wParam;
    LPARAM lParam;
    DWORD time;
    POINT pt;
} MSG, *PMSG, *LPMSG;

typedef struct tagWNDCLASSA {
    UINT style;
    WNDPROC lpfnWndProc;
    int cbClsExtra;
    int cbWndExtra;
    HINSTANCE hInstance;
    HICON hIcon;
    HCURSOR hCursor;
    HBRUSH hbrBackground;
    LPCSTR lpszMenuName;
    LPCSTR lpszClassName;
} WNDCLASSA, WNDCLASS, *PWNDCLASS, *LPWNDCLASS;

typedef struct tagWNDCLASSEXA {
    UINT cbSize;
    UINT style;
    WNDPROC lpfnWndProc;
    int cbClsExtra;
    int cbWndExtra;
    HINSTANCE hInstance;
    HICON hIcon;
    HCURSOR hCursor;
    HBRUSH hbrBackground;
    LPCSTR lpszMenuName;
    LPCSTR lpszClassName;
    HICON hIconSm;
} WNDCLASSEXA, WNDCLASSEX, *PWNDCLASSEX, *LPWNDCLASSEX;

typedef struct tagPAINTSTRUCT {
    HDC hdc;
    BOOL fErase;
    RECT rcPaint;
    BOOL fRestore;
    BOOL fIncUpdate;
    BYTE rgbReserved[32];
} PAINTSTRUCT, *PPAINTSTRUCT, *LPPAINTSTRUCT;

typedef struct tagBITMAPINFOHEADER {
    DWORD biSize;
    LONG  biWidth;
    LONG  biHeight;
    WORD  biPlanes;
    WORD  biBitCount;
    DWORD biCompression;
    DWORD biSizeImage;
    LONG  biXPelsPerMeter;
    LONG  biYPelsPerMeter;
    DWORD biClrUsed;
    DWORD biClrImportant;
} BITMAPINFOHEADER, *LPBITMAPINFOHEADER, *PBITMAPINFOHEADER;

typedef struct tagBITMAPFILEHEADER {
    WORD  bfType;
    DWORD bfSize;
    WORD  bfReserved1;
    WORD  bfReserved2;
    DWORD bfOffBits;
} __attribute__((packed)) BITMAPFILEHEADER, *LPBITMAPFILEHEADER, *PBITMAPFILEHEADER;

typedef struct tagRGBQUAD {
    BYTE rgbBlue;
    BYTE rgbGreen;
    BYTE rgbRed;
    BYTE rgbReserved;
} RGBQUAD;

typedef struct tagBITMAPINFO {
    BITMAPINFOHEADER bmiHeader;
    RGBQUAD bmiColors[1];
} BITMAPINFO, *LPBITMAPINFO, *PBITMAPINFO;

typedef struct tagPALETTEENTRY {
    BYTE peRed;
    BYTE peGreen;
    BYTE peBlue;
    BYTE peFlags;
} PALETTEENTRY, *PPALETTEENTRY, *LPPALETTEENTRY;

typedef struct tagLOGPALETTE {
    WORD palVersion;
    WORD palNumEntries;
    PALETTEENTRY palPalEntry[1];
} LOGPALETTE, *PLOGPALETTE, *LPLOGPALETTE;

typedef struct tagLOGFONTA {
    LONG lfHeight;
    LONG lfWidth;
    LONG lfEscapement;
    LONG lfOrientation;
    LONG lfWeight;
    BYTE lfItalic;
    BYTE lfUnderline;
    BYTE lfStrikeOut;
    BYTE lfCharSet;
    BYTE lfOutPrecision;
    BYTE lfClipPrecision;
    BYTE lfQuality;
    BYTE lfPitchAndFamily;
    CHAR lfFaceName[32];
} LOGFONTA, LOGFONT, *PLOGFONT, *LPLOGFONT;

typedef struct _SYSTEMTIME {
    WORD wYear;
    WORD wMonth;
    WORD wDayOfWeek;
    WORD wDay;
    WORD wHour;
    WORD wMinute;
    WORD wSecond;
    WORD wMilliseconds;
} SYSTEMTIME, *PSYSTEMTIME, *LPSYSTEMTIME;

typedef struct _FILETIME {
    DWORD dwLowDateTime;
    DWORD dwHighDateTime;
} FILETIME, *PFILETIME, *LPFILETIME;

typedef struct _WIN32_FIND_DATAA {
    DWORD dwFileAttributes;
    FILETIME ftCreationTime;
    FILETIME ftLastAccessTime;
    FILETIME ftLastWriteTime;
    DWORD nFileSizeHigh;
    DWORD nFileSizeLow;
    DWORD dwReserved0;
    DWORD dwReserved1;
    CHAR cFileName[MAX_PATH];
    CHAR cAlternateFileName[14];
} WIN32_FIND_DATAA, WIN32_FIND_DATA, *PWIN32_FIND_DATA, *LPWIN32_FIND_DATA;

typedef struct _SECURITY_ATTRIBUTES {
    DWORD nLength;
    LPVOID lpSecurityDescriptor;
    BOOL bInheritHandle;
} SECURITY_ATTRIBUTES, *PSECURITY_ATTRIBUTES, *LPSECURITY_ATTRIBUTES;

typedef struct _CRITICAL_SECTION {
    int dummy;
} CRITICAL_SECTION, *PCRITICAL_SECTION, *LPCRITICAL_SECTION;

typedef struct _OSVERSIONINFOA {
    DWORD dwOSVersionInfoSize;
    DWORD dwMajorVersion;
    DWORD dwMinorVersion;
    DWORD dwBuildNumber;
    DWORD dwPlatformId;
    CHAR szCSDVersion[128];
} OSVERSIONINFOA, OSVERSIONINFO, *POSVERSIONINFO, *LPOSVERSIONINFO;

/* File Attributes & Modes */
#define FILE_ATTRIBUTE_READONLY  0x00000001
#define FILE_ATTRIBUTE_HIDDEN    0x00000002
#define FILE_ATTRIBUTE_SYSTEM    0x00000004
#define FILE_ATTRIBUTE_DIRECTORY 0x00000010
#define FILE_ATTRIBUTE_ARCHIVE   0x00000020
#define FILE_ATTRIBUTE_NORMAL    0x00000080

#define GENERIC_READ             0x80000000L
#define GENERIC_WRITE            0x40000000L
#define FILE_SHARE_READ          0x00000001
#define FILE_SHARE_WRITE         0x00000002
#define CREATE_NEW               1
#define CREATE_ALWAYS            2
#define OPEN_EXISTING            3
#define OPEN_ALWAYS              4
#define TRUNCATE_EXISTING        5
#define FILE_BEGIN               0
#define FILE_CURRENT             1
#define FILE_END                 2

/* Window Messages */
#define WM_NULL                  0x0000
#define WM_CREATE                0x0001
#define WM_DESTROY               0x0002
#define WM_MOVE                  0x0003
#define WM_SIZE                  0x0005
#define WM_ACTIVATE              0x0006
#define WM_SETFOCUS              0x0007
#define WM_KILLFOCUS             0x0008
#define WM_ENABLE                0x000A
#define WM_SETTEXT               0x000C
#define WM_GETTEXT               0x000D
#define WM_GETTEXTLENGTH         0x000E
#define WM_PAINT                 0x000F
#define WM_CLOSE                 0x0010
#define WM_QUIT                  0x0012
#define WM_ERASEBKGND            0x0014
#define WM_SHOWWINDOW            0x0018
#define WM_ACTIVATEAPP           0x001C
#define WM_SETCURSOR             0x0020
#define WM_MOUSEACTIVATE         0x0021
#define WM_GETMINMAXINFO         0x0024
#define WM_WINDOWPOSCHANGING     0x0046
#define WM_WINDOWPOSCHANGED      0x0047
#define WM_INPUTLANGCHANGE       0x0051
#define WM_NCCREATE              0x0081
#define WM_NCDESTROY             0x0082
#define WM_NCCALCSIZE            0x0083
#define WM_NCHITTEST             0x0084
#define WM_NCPAINT               0x0085
#define WM_NCACTIVATE            0x0086
#define WM_KEYDOWN               0x0100
#define WM_KEYUP                 0x0101
#define WM_CHAR                  0x0102
#define WM_DEADCHAR              0x0103
#define WM_SYSKEYDOWN            0x0104
#define WM_SYSKEYUP              0x0105
#define WM_SYSCHAR               0x0106
#define WM_IME_STARTCOMPOSITION  0x010D
#define WM_IME_ENDCOMPOSITION    0x010E
#define WM_IME_COMPOSITION       0x010F
#define WM_INITDIALOG            0x0110
#define WM_COMMAND               0x0111
#define WM_SYSCOMMAND            0x0112
#define WM_TIMER                 0x0113
#define WM_HSCROLL               0x0114
#define WM_VSCROLL               0x0115
#define WM_MOUSEMOVE             0x0200
#define WM_LBUTTONDOWN           0x0201
#define WM_LBUTTONUP             0x0202
#define WM_LBUTTONDBLCLK         0x0203
#define WM_RBUTTONDOWN           0x0204
#define WM_RBUTTONUP             0x0205
#define WM_RBUTTONDBLCLK         0x0206
#define WM_MBUTTONDOWN           0x0207
#define WM_MBUTTONUP             0x0208
#define WM_MBUTTONDBLCLK         0x0209
#define WM_MOUSEWHEEL            0x020A
#define WM_IME_SETCONTEXT        0x0281
#define WM_IME_NOTIFY            0x0282
#define WM_IME_CHAR              0x0286
#define WM_USER                  0x0400
#define WM_APP                   0x8000

#define WA_INACTIVE              0
#define WA_ACTIVE                1
#define WA_CLICKACTIVE           2

#define SC_MINIMIZE              0xF020
#define SC_MAXIMIZE              0xF030
#define SC_CLOSE                 0xF060
#define SC_RESTORE               0xF120
#define SC_SCREENSAVE            0xF140
#define SC_MONITORPOWER          0xF170

#define PM_NOREMOVE              0x0000
#define PM_REMOVE                0x0001

/* Virtual Keys */
#define VK_LBUTTON        0x01
#define VK_RBUTTON        0x02
#define VK_CANCEL         0x03
#define VK_MBUTTON        0x04
#define VK_BACK           0x08
#define VK_TAB            0x09
#define VK_CLEAR          0x0C
#define VK_RETURN         0x0D
#define VK_SHIFT          0x10
#define VK_CONTROL        0x11
#define VK_MENU           0x12
#define VK_PAUSE          0x13
#define VK_CAPITAL        0x14
#define VK_KANA           0x15
#define VK_HANGUL         0x15
#define VK_ESCAPE         0x1B
#define VK_CONVERT        0x1C
#define VK_NONCONVERT     0x1D
#define VK_SPACE          0x20
#define VK_PRIOR          0x21
#define VK_NEXT           0x22
#define VK_END            0x23
#define VK_HOME           0x24
#define VK_LEFT           0x25
#define VK_UP             0x26
#define VK_RIGHT          0x27
#define VK_DOWN           0x28
#define VK_SELECT         0x29
#define VK_PRINT          0x2A
#define VK_EXECUTE        0x2B
#define VK_SNAPSHOT       0x2C
#define VK_INSERT         0x2D
#define VK_DELETE         0x2E
#define VK_HELP           0x2F
#define VK_LWIN           0x5B
#define VK_RWIN           0x5C
#define VK_APPS           0x5D
#define VK_NUMPAD0        0x60
#define VK_NUMPAD1        0x61
#define VK_NUMPAD2        0x62
#define VK_NUMPAD3        0x63
#define VK_NUMPAD4        0x64
#define VK_NUMPAD5        0x65
#define VK_NUMPAD6        0x66
#define VK_NUMPAD7        0x67
#define VK_NUMPAD8        0x68
#define VK_NUMPAD9        0x69
#define VK_MULTIPLY       0x6A
#define VK_ADD            0x6B
#define VK_SEPARATOR      0x6C
#define VK_SUBTRACT       0x6D
#define VK_DECIMAL        0x6E
#define VK_DIVIDE         0x6F
#define VK_F1             0x70
#define VK_F2             0x71
#define VK_F3             0x72
#define VK_F4             0x73
#define VK_F5             0x74
#define VK_F6             0x75
#define VK_F7             0x76
#define VK_F8             0x77
#define VK_F9             0x78
#define VK_F10            0x79
#define VK_F11            0x7A
#define VK_F12            0x7B
#define VK_NUMLOCK        0x90
#define VK_SCROLL         0x91
#define VK_LSHIFT         0xA0
#define VK_RSHIFT         0xA1
#define VK_LCONTROL       0xA2
#define VK_RCONTROL       0xA3
#define VK_LMENU          0xA4
#define VK_RMENU          0xA5

/* Window Styles */
#define WS_OVERLAPPED       0x00000000L
#define WS_POPUP            0x80000000L
#define WS_CHILD            0x40000000L
#define WS_MINIMIZE         0x20000000L
#define WS_VISIBLE          0x10000000L
#define WS_DISABLED         0x08000000L
#define WS_CLIPSIBLINGS     0x04000000L
#define WS_CLIPCHILDREN     0x02000000L
#define WS_MAXIMIZE         0x01000000L
#define WS_CAPTION          0x00C00000L
#define WS_BORDER           0x00800000L
#define WS_DLGFRAME         0x00400000L
#define WS_VSCROLL          0x00200000L
#define WS_HSCROLL          0x00100000L
#define WS_SYSMENU          0x00080000L
#define WS_THICKFRAME       0x00040000L
#define WS_GROUP            0x00020000L
#define WS_TABSTOP          0x00010000L
#define WS_MINIMIZEBOX      0x00020000L
#define WS_MAXIMIZEBOX      0x00010000L
#define WS_OVERLAPPEDWINDOW (WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX)
#define WS_POPUPWINDOW      (WS_POPUP | WS_BORDER | WS_SYSMENU)

#define WS_EX_TOPMOST       0x00000008L
#define WS_EX_TOOLWINDOW    0x00000080L
#define WS_EX_WINDOWEDGE    0x00000100L
#define WS_EX_CLIENTEDGE    0x00000200L
#define WS_EX_APPWINDOW     0x00040000L

#define ES_LEFT             0x0000L
#define ES_CENTER           0x0001L
#define ES_RIGHT            0x0002L
#define ES_MULTILINE        0x0004L
#define ES_UPPERCASE        0x0008L
#define ES_LOWERCASE        0x0010L
#define ES_PASSWORD         0x0020L
#define ES_AUTOVSCROLL      0x0040L
#define ES_AUTOHSCROLL      0x0080L
#define ES_NOHIDESEL        0x0100L
#define ES_OEMCONVERT       0x0400L
#define ES_READONLY         0x0800L
#define ES_WANTRETURN       0x1000L
#define ES_NUMBER           0x2000L

#define CS_VREDRAW          0x0001
#define CS_HREDRAW          0x0002
#define CS_DBLCLKS          0x0008
#define CS_OWNDC            0x0020
#define CS_CLASSDC          0x0040
#define CS_PARENTDC         0x0080
#define CS_NOCLOSE          0x0200
#define CS_SAVEBITS         0x0800
#define CS_BYTEALIGNCLIENT  0x1000
#define CS_BYTEALIGNWINDOW  0x2000
#define CS_GLOBALCLASS      0x4000

#define SW_HIDE             0
#define SW_SHOWNORMAL       1
#define SW_NORMAL           1
#define SW_SHOWMINIMIZED    2
#define SW_SHOWMAXIMIZED    3
#define SW_MAXIMIZE         3
#define SW_SHOWNOACTIVATE   4
#define SW_SHOW             5
#define SW_MINIMIZE         6
#define SW_SHOWMINNOACTIVE  7
#define SW_SHOWNA           8
#define SW_RESTORE          9
#define SW_SHOWDEFAULT      10

#define GWL_WNDPROC         (-4)
#define GWL_HINSTANCE       (-6)
#define GWL_HWNDPARENT      (-8)
#define GWL_STYLE           (-16)
#define GWL_EXSTYLE         (-20)
#define GWL_USERDATA        (-21)
#define GWL_ID              (-12)

#define SM_CXSCREEN         0
#define SM_CYSCREEN         1
#define SM_CXFRAME          32
#define SM_CYFRAME          33
#define SM_CYCAPTION        4
#define SM_CXBORDER         5
#define SM_CYBORDER         6
#define SM_CXDLGFRAME       7
#define SM_CYDLGFRAME       8
#define SM_CXFIXEDFRAME     SM_CXDLGFRAME
#define SM_CYFIXEDFRAME     SM_CYDLGFRAME

#define MB_OK               0x00000000L
#define MB_OKCANCEL         0x00000001L
#define MB_ABORTRETRYIGNORE 0x00000002L
#define MB_YESNOCANCEL      0x00000003L
#define MB_YESNO            0x00000004L
#define MB_RETRYCANCEL      0x00000005L
#define MB_ICONHAND         0x00000010L
#define MB_ICONQUESTION     0x00000020L
#define MB_ICONEXCLAMATION  0x00000030L
#define MB_ICONASTERISK     0x00000040L
#define MB_ICONWARNING      MB_ICONEXCLAMATION
#define MB_ICONERROR        MB_ICONHAND
#define MB_ICONINFORMATION  MB_ICONASTERISK
#define MB_ICONSTOP         MB_ICONHAND
#define MB_SYSTEMMODAL      0x00001000L
#define MB_TASKMODAL        0x00002000L
#define MB_TOPMOST          0x00040000L

#define IDOK                1
#define IDCANCEL            2
#define IDABORT             3
#define IDRETRY             4
#define IDIGNORE            5
#define IDYES               6
#define IDNO                7

/* GDI Constants */
#define TRANSPARENT         1
#define OPAQUE              2
#define TA_NOUPDATECP       0
#define TA_UPDATECP         1
#define TA_LEFT             0
#define TA_RIGHT            2
#define TA_CENTER           6
#define TA_TOP              0
#define TA_BOTTOM           8
#define TA_BASELINE         24

#define FW_DONTCARE         0
#define FW_THIN             100
#define FW_EXTRALIGHT       200
#define FW_LIGHT            300
#define FW_NORMAL           400
#define FW_REGULAR          400
#define FW_MEDIUM           500
#define FW_SEMIBOLD         600
#define FW_BOLD             700
#define FW_EXTRABOLD        800
#define FW_HEAVY            900

#define ANSI_CHARSET        0
#define DEFAULT_CHARSET     1
#define SYMBOL_CHARSET      2
#define SHIFTJIS_CHARSET    128
#define HANGEUL_CHARSET     129
#define HANGUL_CHARSET      129
#define GB2312_CHARSET      134
#define CHINESEBIG5_CHARSET 136
#define OEM_CHARSET         255
#define THAI_CHARSET        222

#define OUT_DEFAULT_PRECIS  0
#define CLIP_DEFAULT_PRECIS 0
#define DEFAULT_QUALITY     0
#define DRAFT_QUALITY       1
#define PROOF_QUALITY       2
#define NONANTIALIASED_QUALITY 3
#define ANTIALIASED_QUALITY 4
#define DEFAULT_PITCH       0
#define FIXED_PITCH         1
#define VARIABLE_PITCH      2
#define FF_DONTCARE         (0<<4)
#define FF_ROMAN            (1<<4)
#define FF_SWISS            (2<<4)
#define FF_MODERN           (3<<4)
#define FF_SCRIPT           (4<<4)
#define FF_DECORATIVE       (5<<4)

#define WHITE_BRUSH         0
#define LTGRAY_BRUSH        1
#define GRAY_BRUSH          2
#define DKGRAY_BRUSH        3
#define BLACK_BRUSH         4
#define NULL_BRUSH          5
#define HOLLOW_BRUSH        NULL_BRUSH
#define WHITE_PEN           6
#define BLACK_PEN           7
#define NULL_PEN            8
#define SYSTEM_FONT         13
#define DEFAULT_GUI_FONT    17

#define BI_RGB              0L
#define DIB_RGB_COLORS      0

#define SRCCOPY             (DWORD)0x00CC0020
#define SRCPAINT            (DWORD)0x00EE0086
#define SRCAND              (DWORD)0x008800C6
#define SRCINVERT           (DWORD)0x00660046
#define SRCERASE            (DWORD)0x00440328
#define NOTSRCCOPY          (DWORD)0x00330008
#define NOTSRCERASE         (DWORD)0x001100A6
#define MERGECOPY           (DWORD)0x00C000CA
#define MERGEPAINT          (DWORD)0x00BB0226
#define PATCOPY             (DWORD)0x00F00021
#define PATPAINT            (DWORD)0x00FB0A09
#define PATINVERT           (DWORD)0x005A0049
#define DSTINVERT           (DWORD)0x00550009
#define BLACKNESS           (DWORD)0x00000042
#define WHITENESS           (DWORD)0x00FF0062

#define IDC_ARROW           ((LPCSTR)32512)
#define IDI_APPLICATION     ((LPCSTR)32512)

#define GMEM_FIXED          0x0000
#define GMEM_MOVEABLE       0x0002
#define GMEM_ZEROINIT       0x0040
#define GHND                (GMEM_MOVEABLE | GMEM_ZEROINIT)
#define GPTR                (GMEM_FIXED | GMEM_ZEROINIT)

#define HKEY_CLASSES_ROOT   ((HKEY)(ULONG_PTR)0x80000000)
#define HKEY_CURRENT_USER   ((HKEY)(ULONG_PTR)0x80000001)
#define HKEY_LOCAL_MACHINE  ((HKEY)(ULONG_PTR)0x80000002)
#define HKEY_USERS          ((HKEY)(ULONG_PTR)0x80000003)
#define KEY_READ            0x20019
#define KEY_WRITE           0x20006
#define KEY_ALL_ACCESS      0xF003F
#define REG_SZ              1
#define REG_DWORD           4
#define ERROR_SUCCESS       0L

#ifdef __cplusplus
extern "C" {
#endif

/* Win32 API Prototypes (Implemented in wasm_platform.cpp or inline) */
DWORD WINAPI timeGetTime(void);
DWORD WINAPI GetTickCount(void);
VOID WINAPI Sleep(DWORD dwMilliseconds);
BOOL WINAPI QueryPerformanceCounter(LARGE_INTEGER *lpPerformanceCount);
BOOL WINAPI QueryPerformanceFrequency(LARGE_INTEGER *lpFrequency);
VOID WINAPI GetLocalTime(LPSYSTEMTIME lpSystemTime);
VOID WINAPI GetSystemTime(LPSYSTEMTIME lpSystemTime);

/* Window & Message API */
ATOM WINAPI RegisterClassA(const WNDCLASSA *lpWndClass);
ATOM WINAPI RegisterClassExA(const WNDCLASSEXA *lpwcx);
#define RegisterClass RegisterClassA
#define RegisterClassEx RegisterClassExA

HWND WINAPI CreateWindowExA(DWORD dwExStyle, LPCSTR lpClassName, LPCSTR lpWindowName, DWORD dwStyle,
    int X, int Y, int nWidth, int nHeight, HWND hWndParent, HMENU hMenu, HINSTANCE hInstance, LPVOID lpParam);
#define CreateWindowEx CreateWindowExA
#define CreateWindowA(lpClassName, lpWindowName, dwStyle, x, y, nWidth, nHeight, hWndParent, hMenu, hInstance, lpParam) \
    CreateWindowExA(0L, lpClassName, lpWindowName, dwStyle, x, y, nWidth, nHeight, hWndParent, hMenu, hInstance, lpParam)
#define CreateWindow CreateWindowA

BOOL WINAPI DestroyWindow(HWND hWnd);
BOOL WINAPI ShowWindow(HWND hWnd, int nCmdShow);
BOOL WINAPI UpdateWindow(HWND hWnd);
BOOL WINAPI MoveWindow(HWND hWnd, int X, int Y, int nWidth, int nHeight, BOOL bRepaint);
BOOL WINAPI SetWindowPos(HWND hWnd, HWND hWndInsertAfter, int X, int Y, int cx, int cy, UINT uFlags);
BOOL WINAPI AdjustWindowRect(LPRECT lpRect, DWORD dwStyle, BOOL bMenu);
BOOL WINAPI AdjustWindowRectEx(LPRECT lpRect, DWORD dwStyle, BOOL bMenu, DWORD dwExStyle);
BOOL WINAPI GetClientRect(HWND hWnd, LPRECT lpRect);
BOOL WINAPI GetWindowRect(HWND hWnd, LPRECT lpRect);
BOOL WINAPI ClientToScreen(HWND hWnd, LPPOINT lpPoint);
BOOL WINAPI ScreenToClient(HWND hWnd, LPPOINT lpPoint);
HWND WINAPI SetFocus(HWND hWnd);
HWND WINAPI GetFocus(void);
HWND WINAPI GetActiveWindow(void);
HWND WINAPI GetForegroundWindow(void);
BOOL WINAPI SetForegroundWindow(HWND hWnd);
HWND WINAPI SetCapture(HWND hWnd);
BOOL WINAPI ReleaseCapture(void);
HWND WINAPI FindWindowA(LPCSTR lpClassName, LPCSTR lpWindowName);
#define FindWindow FindWindowA

BOOL WINAPI SetWindowTextA(HWND hWnd, LPCSTR lpString);
int WINAPI GetWindowTextA(HWND hWnd, LPSTR lpString, int nMaxCount);
int WINAPI GetWindowTextLengthA(HWND hWnd);
#define SetWindowText SetWindowTextA
#define GetWindowText GetWindowTextA
#define GetWindowTextLength GetWindowTextLengthA

LONG WINAPI SetWindowLongA(HWND hWnd, int nIndex, LONG dwNewLong);
LONG WINAPI GetWindowLongA(HWND hWnd, int nIndex);
#define SetWindowLong SetWindowLongA
#define GetWindowLong GetWindowLongA

LRESULT WINAPI SendMessageA(HWND hWnd, UINT Msg, WPARAM wParam, LPARAM lParam);
BOOL WINAPI PostMessageA(HWND hWnd, UINT Msg, WPARAM wParam, LPARAM lParam);
VOID WINAPI PostQuitMessage(int nExitCode);
LRESULT WINAPI DefWindowProcA(HWND hWnd, UINT Msg, WPARAM wParam, LPARAM lParam);
LRESULT WINAPI CallWindowProcA(WNDPROC lpPrevWndFunc, HWND hWnd, UINT Msg, WPARAM wParam, LPARAM lParam);
#define SendMessage SendMessageA
#define PostMessage PostMessageA
#define DefWindowProc DefWindowProcA
#define CallWindowProc CallWindowProcA
#ifndef STRICT
inline LRESULT CallWindowProcA_Far(FARPROC lpPrevWndFunc, HWND hWnd, UINT Msg, WPARAM wParam, LPARAM lParam) {
    return CallWindowProcA((WNDPROC)lpPrevWndFunc, hWnd, Msg, wParam, lParam);
}
#endif

BOOL WINAPI PeekMessageA(LPMSG lpMsg, HWND hWnd, UINT wMsgFilterMin, UINT wMsgFilterMax, UINT wRemoveMsg);
BOOL WINAPI GetMessageA(LPMSG lpMsg, HWND hWnd, UINT wMsgFilterMin, UINT wMsgFilterMax);
BOOL WINAPI TranslateMessage(const MSG *lpMsg);
LRESULT WINAPI DispatchMessageA(const MSG *lpMsg);
#define PeekMessage PeekMessageA
#define GetMessage GetMessageA
#define DispatchMessage DispatchMessageA

UINT_PTR WINAPI SetTimer(HWND hWnd, UINT_PTR nIDEvent, UINT uElapse, void* lpTimerFunc);
BOOL WINAPI KillTimer(HWND hWnd, UINT_PTR uIDEvent);

int WINAPI GetSystemMetrics(int nIndex);
int WINAPI ShowCursor(BOOL bShow);
HCURSOR WINAPI SetCursor(HCURSOR hCursor);
HCURSOR WINAPI LoadCursorA(HINSTANCE hInstance, LPCSTR lpCursorName);
HICON WINAPI LoadIconA(HINSTANCE hInstance, LPCSTR lpIconName);
#define LoadCursor LoadCursorA
#define LoadIcon LoadIconA
BOOL WINAPI GetCursorPos(LPPOINT lpPoint);
BOOL WINAPI SetCursorPos(int X, int Y);
SHORT WINAPI GetAsyncKeyState(int vKey);
SHORT WINAPI GetKeyState(int nVirtKey);

int WINAPI MessageBoxA(HWND hWnd, LPCSTR lpText, LPCSTR lpCaption, UINT uType);
#define MessageBox MessageBoxA

/* GDI API */
HDC WINAPI GetDC(HWND hWnd);
int WINAPI ReleaseDC(HWND hWnd, HDC hDC);
HDC WINAPI BeginPaint(HWND hWnd, LPPAINTSTRUCT lpPaint);
BOOL WINAPI EndPaint(HWND hWnd, const PAINTSTRUCT *lpPaint);
HDC WINAPI CreateCompatibleDC(HDC hdc);
BOOL WINAPI DeleteDC(HDC hdc);
HBITMAP WINAPI CreateCompatibleBitmap(HDC hdc, int cx, int cy);
HGDIOBJ WINAPI SelectObject(HDC hdc, HGDIOBJ h);
BOOL WINAPI DeleteObject(HGDIOBJ ho);
HGDIOBJ WINAPI GetStockObject(int i);
int WINAPI SetBkMode(HDC hdc, int mode);
COLORREF WINAPI SetBkColor(HDC hdc, COLORREF color);
COLORREF WINAPI SetTextColor(HDC hdc, COLORREF color);
UINT WINAPI SetTextAlign(HDC hdc, UINT align);
BOOL WINAPI TextOutA(HDC hdc, int x, int y, LPCSTR lpString, int c);
#define TextOut TextOutA
BOOL WINAPI GetTextExtentPoint32A(HDC hdc, LPCSTR lpString, int c, LPSIZE psizl);
#define GetTextExtentPoint32 GetTextExtentPoint32A
HFONT WINAPI CreateFontA(int cHeight, int cWidth, int cEscapement, int cOrientation, int cWeight,
    DWORD bItalic, DWORD bUnderline, DWORD bStrikeOut, DWORD iCharSet, DWORD iOutPrecision,
    DWORD iClipPrecision, DWORD iQuality, DWORD iPitchAndFamily, LPCSTR pszFaceName);
HFONT WINAPI CreateFontIndirectA(const LOGFONTA *lplf);
#define CreateFont CreateFontA
#define CreateFontIndirect CreateFontIndirectA
HRGN WINAPI CreateRectRgn(int x1, int y1, int x2, int y2);
HBRUSH WINAPI CreateSolidBrush(COLORREF color);
int WINAPI FillRect(HDC hDC, const RECT *lprc, HBRUSH hbr);
BOOL WINAPI BitBlt(HDC hdc, int x, int y, int cx, int cy, HDC hdcSrc, int x1, int y1, DWORD rop);
int WINAPI SetDIBitsToDevice(HDC hdc, int xDest, int yDest, DWORD w, DWORD h, int xSrc, int ySrc,
    UINT StartScan, UINT cLines, const VOID *lpvBits, const BITMAPINFO *lpbmi, UINT ColorUse);
int WINAPI StretchDIBits(HDC hdc, int xDest, int yDest, int DestWidth, int DestHeight,
    int xSrc, int ySrc, int SrcWidth, int SrcHeight, const VOID *lpBits, const BITMAPINFO *lpbmi,
    UINT iUsage, DWORD rop);

/* File & Directory API */
HANDLE WINAPI CreateFileA(LPCSTR lpFileName, DWORD dwDesiredAccess, DWORD dwShareMode,
    LPSECURITY_ATTRIBUTES lpSecurityAttributes, DWORD dwCreationDisposition, DWORD dwFlagsAndAttributes,
    HANDLE hTemplateFile);
#define CreateFile CreateFileA
BOOL WINAPI ReadFile(HANDLE hFile, LPVOID lpBuffer, DWORD nNumberOfBytesToRead, LPDWORD lpNumberOfBytesRead, void* lpOverlapped);
BOOL WINAPI WriteFile(HANDLE hFile, LPCVOID lpBuffer, DWORD nNumberOfBytesToWrite, LPDWORD lpNumberOfBytesWritten, void* lpOverlapped);
DWORD WINAPI SetFilePointer(HANDLE hFile, LONG lDistanceToMove, PLONG lpDistanceToMoveHigh, DWORD dwMoveMethod);
DWORD WINAPI GetFileSize(HANDLE hFile, LPDWORD lpFileSizeHigh);
DWORD WINAPI GetFileAttributesA(LPCSTR lpFileName);
BOOL WINAPI SetFileAttributesA(LPCSTR lpFileName, DWORD dwFileAttributes);
#define GetFileAttributes GetFileAttributesA
#define SetFileAttributes SetFileAttributesA
BOOL WINAPI DeleteFileA(LPCSTR lpFileName);
BOOL WINAPI CopyFileA(LPCSTR lpExistingFileName, LPCSTR lpNewFileName, BOOL bFailIfExists);
BOOL WINAPI MoveFileA(LPCSTR lpExistingFileName, LPCSTR lpNewFileName);
BOOL WINAPI CreateDirectoryA(LPCSTR lpPathName, LPSECURITY_ATTRIBUTES lpSecurityAttributes);
BOOL WINAPI RemoveDirectoryA(LPCSTR lpPathName);
DWORD WINAPI GetCurrentDirectoryA(DWORD nBufferLength, LPSTR lpBuffer);
BOOL WINAPI SetCurrentDirectoryA(LPCSTR lpPathName);
#define DeleteFile DeleteFileA
#define CopyFile CopyFileA
#define MoveFile MoveFileA
#define CreateDirectory CreateDirectoryA
#define RemoveDirectory RemoveDirectoryA
#define GetCurrentDirectory GetCurrentDirectoryA
#define SetCurrentDirectory SetCurrentDirectoryA
HANDLE WINAPI FindFirstFileA(LPCSTR lpFileName, LPWIN32_FIND_DATA lpFindFileData);
BOOL WINAPI FindNextFileA(HANDLE hFindFile, LPWIN32_FIND_DATA lpFindFileData);
BOOL WINAPI FindClose(HANDLE hFindFile);
#define FindFirstFile FindFirstFileA
#define FindNextFile FindNextFileA
BOOL WINAPI CloseHandle(HANDLE hObject);

UINT WINAPI GetPrivateProfileIntA(LPCSTR lpAppName, LPCSTR lpKeyName, INT nDefault, LPCSTR lpFileName);
DWORD WINAPI GetPrivateProfileStringA(LPCSTR lpAppName, LPCSTR lpKeyName, LPCSTR lpDefault, LPSTR lpReturnedString, DWORD nSize, LPCSTR lpFileName);
BOOL WINAPI WritePrivateProfileStringA(LPCSTR lpAppName, LPCSTR lpKeyName, LPCSTR lpString, LPCSTR lpFileName);
#define GetPrivateProfileInt GetPrivateProfileIntA
#define GetPrivateProfileString GetPrivateProfileStringA
#define WritePrivateProfileString WritePrivateProfileStringA

/* System / Process / Memory / Debug API */
VOID WINAPI OutputDebugStringA(LPCSTR lpOutputString);
#define OutputDebugString OutputDebugStringA
VOID WINAPI DebugBreak(void);
DWORD WINAPI GetLastError(void);
VOID WINAPI SetLastError(DWORD dwErrCode);
HMODULE WINAPI GetModuleHandleA(LPCSTR lpModuleName);
DWORD WINAPI GetModuleFileNameA(HMODULE hModule, LPSTR lpFilename, DWORD nSize);
HMODULE WINAPI LoadLibraryA(LPCSTR lpLibFileName);
FARPROC WINAPI GetProcAddress(HMODULE hModule, LPCSTR lpProcName);
BOOL WINAPI FreeLibrary(HMODULE hLibModule);
#define GetModuleHandle GetModuleHandleA
#define GetModuleFileName GetModuleFileNameA
#define LoadLibrary LoadLibraryA
VOID WINAPI InitializeCriticalSection(LPCRITICAL_SECTION lpCriticalSection);
VOID WINAPI EnterCriticalSection(LPCRITICAL_SECTION lpCriticalSection);
VOID WINAPI LeaveCriticalSection(LPCRITICAL_SECTION lpCriticalSection);
VOID WINAPI DeleteCriticalSection(LPCRITICAL_SECTION lpCriticalSection);
HANDLE WINAPI CreateMutexA(LPSECURITY_ATTRIBUTES lpMutexAttributes, BOOL bInitialOwner, LPCSTR lpName);
#define CreateMutex CreateMutexA
HANDLE WINAPI CreateEventA(LPSECURITY_ATTRIBUTES lpEventAttributes, BOOL bManualReset, BOOL bInitialState, LPCSTR lpName);
#define CreateEvent CreateEventA
BOOL WINAPI SetEvent(HANDLE hEvent);
BOOL WINAPI ResetEvent(HANDLE hEvent);
DWORD WINAPI WaitForSingleObject(HANDLE hHandle, DWORD dwMilliseconds);
HANDLE WINAPI CreateThread(LPSECURITY_ATTRIBUTES lpThreadAttributes, SIZE_T dwStackSize, void* lpStartAddress, LPVOID lpParameter, DWORD dwCreationFlags, LPDWORD lpThreadId);
BOOL WINAPI TerminateThread(HANDLE hThread, DWORD dwExitCode);
VOID WINAPI ExitProcess(UINT uExitCode);
BOOL WINAPI GetVersionExA(LPOSVERSIONINFO lpVersionInformation);
#define GetVersionEx GetVersionExA
HGLOBAL WINAPI GlobalAlloc(UINT uFlags, SIZE_T dwBytes);
LPVOID WINAPI GlobalLock(HGLOBAL hMem);
BOOL WINAPI GlobalUnlock(HGLOBAL hMem);
HGLOBAL WINAPI GlobalFree(HGLOBAL hMem);
BOOL WINAPI OpenClipboard(HWND hWndNewOwner);
BOOL WINAPI CloseClipboard(void);
BOOL WINAPI EmptyClipboard(void);
HANDLE WINAPI GetClipboardData(UINT uFormat);
HANDLE WINAPI SetClipboardData(UINT uFormat, HANDLE hMem);
#define CF_TEXT 1

HINSTANCE WINAPI ShellExecuteA(HWND hwnd, LPCSTR lpOperation, LPCSTR lpFile, LPCSTR lpParameters, LPCSTR lpDirectory, INT nShowCmd);
#define ShellExecute ShellExecuteA

int WINAPI MultiByteToWideChar(UINT CodePage, DWORD dwFlags, LPCSTR lpMultiByteStr, int cbMultiByte, LPWSTR lpWideCharStr, int cchWideChar);
int WINAPI WideCharToMultiByte(UINT CodePage, DWORD dwFlags, LPCWSTR lpWideCharStr, int cchWideChar, LPSTR lpMultiByteStr, int cbMultiByte, LPCSTR lpDefaultChar, LPBOOL lpUsedDefaultChar);
#define CP_ACP 0
#define CP_UTF8 65001

/* MSVC C runtime string/path helpers */
int _stricmp(const char *s1, const char *s2);
int _strnicmp(const char *s1, const char *s2, size_t n);
char* _strupr(char *str);
char* _strlwr(char *str);
char* _itoa(int value, char *str, int radix);
char* _ltoa(long value, char *str, int radix);
char* _ultoa(unsigned long value, char *str, int radix);
void _splitpath(const char *path, char *drive, char *dir, char *fname, char *ext);
void _makepath(char *path, const char *drive, const char *dir, const char *fname, const char *ext);
long _filelength(int fd);

#define stricmp _stricmp
#define strnicmp _strnicmp
#define strcmpi _stricmp
#define lstrcmpi _stricmp
#define lstrcmp strcmp
#define lstrcpy strcpy
#define lstrcpyn strncpy
#define lstrcat strcat
#define lstrlen strlen
#define strupr _strupr
#define strlwr _strlwr
#define itoa _itoa
#define ltoa _ltoa
#define ultoa _ultoa
#define _snprintf snprintf
#define _vsnprintf vsnprintf
#define wsprintf sprintf
#define wvsprintf vsprintf

/* Custom WASM VFS fopen hook */
FILE* dr_wasm_fopen(const char* filename, const char* mode);

#ifdef __cplusplus
}
#endif

#ifndef __cplusplus
#ifndef min
#define min(a,b) (((a) < (b)) ? (a) : (b))
#endif
#ifndef max
#define max(a,b) (((a) > (b)) ? (a) : (b))
#endif
#else
using std::min;
using std::max;
template <typename T, typename U>
inline T min(T a, U b) { return (a < (T)b) ? a : (T)b; }
template <typename T, typename U>
inline T max(T a, U b) { return (a > (T)b) ? a : (T)b; }
#endif


typedef struct tagPOINTS {
    SHORT x;
    SHORT y;
} POINTS, *PPOINTS, *LPPOINTS;

typedef struct _EXCEPTION_RECORD {
    DWORD ExceptionCode;
    DWORD ExceptionFlags;
    struct _EXCEPTION_RECORD *ExceptionRecord;
    PVOID ExceptionAddress;
    DWORD NumberParameters;
    ULONG_PTR ExceptionInformation[15];
} EXCEPTION_RECORD, *PEXCEPTION_RECORD, *LPEXCEPTION_RECORD;

typedef struct _CONTEXT {
    DWORD ContextFlags;
} CONTEXT, *PCONTEXT, *LPCONTEXT;

typedef struct _EXCEPTION_POINTERS {
    PEXCEPTION_RECORD ExceptionRecord;
    PCONTEXT ContextRecord;
} EXCEPTION_POINTERS, *PEXCEPTION_POINTERS, *LPEXCEPTION_POINTERS;

typedef struct _RGNDATAHEADER {
    DWORD dwSize;
    DWORD iType;
    DWORD nCount;
    DWORD nRgnSize;
    RECT  rcBound;
} RGNDATAHEADER, *PRGNDATAHEADER;

typedef struct _RGNDATA {
    RGNDATAHEADER rdh;
    char          Buffer[1];
} RGNDATA, *PRGNDATA, *LPRGNDATA;
#define RDH_RECTANGLES 1

#define MF_BYCOMMAND    0x00000000L
#define MF_BYPOSITION   0x00000400L
#define MF_ENABLED      0x00000000L
#define MF_GRAYED       0x00000001L
#define MF_DISABLED     0x00000002L
#define MF_UNCHECKED    0x00000000L
#define MF_CHECKED      0x00000008L

#define BM_GETCHECK     0x00F0
#define BM_SETCHECK     0x00F1
#define BST_UNCHECKED   0x0000
#define BST_CHECKED     0x0001
#define BST_INDETERMINATE 0x0002

#define WM_SETFONT      0x0030
#define WM_GETFONT      0x0031
#define WM_INITMENUPOPUP 0x0117
#define WM_DROPFILES    0x0233

#define LB_ADDSTRING    0x0180
#define LB_INSERTSTRING 0x0181
#define LB_DELETESTRING 0x0182
#define LB_RESETCONTENT 0x0184
#define LB_SETCURSEL    0x0186
#define LB_GETCURSEL    0x0187
#define LB_GETTEXT      0x0189
#define LB_GETCOUNT     0x018B
#define LB_ERR          (-1)

#define CB_ADDSTRING    0x0143
#define CB_DELETESTRING 0x0144
#define CB_RESETCONTENT 0x014B
#define CB_GETCOUNT     0x0146
#define CB_GETCURSEL    0x0147
#define CB_SETCURSEL    0x014E
#define CB_GETLBTEXT    0x0148
#define CB_ERR          (-1)

#define STD_INPUT_HANDLE  ((DWORD)-10)
#define STD_OUTPUT_HANDLE ((DWORD)-11)
#define STD_ERROR_HANDLE  ((DWORD)-12)

#define __min(a,b) (((a) < (b)) ? (a) : (b))
#define __max(a,b) (((a) > (b)) ? (a) : (b))
#define _fileno fileno
#define filelength _filelength

#ifdef __cplusplus
extern "C" {
#endif

inline BOOL WINAPI SetRect(LPRECT lprc, int xLeft, int yTop, int xRight, int yBottom) {
    if (!lprc) return FALSE;
    lprc->left = xLeft; lprc->top = yTop; lprc->right = xRight; lprc->bottom = yBottom;
    return TRUE;
}
inline BOOL WINAPI SetRectEmpty(LPRECT lprc) {
    if (!lprc) return FALSE;
    lprc->left = lprc->top = lprc->right = lprc->bottom = 0;
    return TRUE;
}
inline BOOL WINAPI PtInRect(const RECT *lprc, POINT pt) {
    if (!lprc) return FALSE;
    return (pt.x >= lprc->left && pt.x < lprc->right && pt.y >= lprc->top && pt.y < lprc->bottom) ? TRUE : FALSE;
}
inline BOOL WINAPI OffsetRect(LPRECT lprc, int dx, int dy) {
    if (!lprc) return FALSE;
    lprc->left += dx; lprc->right += dx; lprc->top += dy; lprc->bottom += dy;
    return TRUE;
}
inline BOOL WINAPI InflateRect(LPRECT lprc, int dx, int dy) {
    if (!lprc) return FALSE;
    lprc->left -= dx; lprc->right += dx; lprc->top -= dy; lprc->bottom += dy;
    return TRUE;
}
inline BOOL WINAPI IntersectRect(LPRECT lprcDst, const RECT *lprcSrc1, const RECT *lprcSrc2) {
    if (!lprcDst || !lprcSrc1 || !lprcSrc2) return FALSE;
    lprcDst->left = (lprcSrc1->left > lprcSrc2->left) ? lprcSrc1->left : lprcSrc2->left;
    lprcDst->top = (lprcSrc1->top > lprcSrc2->top) ? lprcSrc1->top : lprcSrc2->top;
    lprcDst->right = (lprcSrc1->right < lprcSrc2->right) ? lprcSrc1->right : lprcSrc2->right;
    lprcDst->bottom = (lprcSrc1->bottom < lprcSrc2->bottom) ? lprcSrc1->bottom : lprcSrc2->bottom;
    if (lprcDst->left >= lprcDst->right || lprcDst->top >= lprcDst->bottom) {
        SetRectEmpty(lprcDst);
        return FALSE;
    }
    return TRUE;
}
inline BOOL WINAPI EqualRect(const RECT *lprc1, const RECT *lprc2) {
    if (!lprc1 || !lprc2) return FALSE;
    return (lprc1->left == lprc2->left && lprc1->top == lprc2->top &&
            lprc1->right == lprc2->right && lprc1->bottom == lprc2->bottom) ? TRUE : FALSE;
}

inline LPSTR WINAPI CharUpperA(LPSTR lpsz) {
    if (((uintptr_t)lpsz) < 256) {
        return (LPSTR)(uintptr_t)toupper((int)(uintptr_t)lpsz);
    }
    for (char* p = lpsz; *p; ++p) *p = (char)toupper((unsigned char)*p);
    return lpsz;
}
inline LPSTR WINAPI CharLowerA(LPSTR lpsz) {
    if (((uintptr_t)lpsz) < 256) {
        return (LPSTR)(uintptr_t)tolower((int)(uintptr_t)lpsz);
    }
    for (char* p = lpsz; *p; ++p) *p = (char)tolower((unsigned char)*p);
    return lpsz;
}
#define CharUpper CharUpperA
#define CharLower CharLowerA

inline HWND WINAPI GetDlgItem(HWND, int) { return NULL; }
inline BOOL WINAPI SetDlgItemTextA(HWND, int, LPCSTR) { return TRUE; }
inline UINT WINAPI GetDlgItemTextA(HWND, int, LPSTR lpStr, int cchMax) { if (lpStr && cchMax > 0) lpStr[0] = 0; return 0; }
inline BOOL WINAPI SetDlgItemInt(HWND, int, UINT, BOOL) { return TRUE; }
inline UINT WINAPI GetDlgItemInt(HWND, int, BOOL*, BOOL) { return 0; }
inline BOOL WINAPI CheckDlgButton(HWND, int, UINT) { return TRUE; }
inline UINT WINAPI IsDlgButtonChecked(HWND, int) { return 0; }
inline BOOL WINAPI CheckRadioButton(HWND, int, int, int) { return TRUE; }
inline LRESULT WINAPI SendDlgItemMessageA(HWND, int, UINT, WPARAM, LPARAM) { return 0; }
inline BOOL WINAPI EndDialog(HWND, INT_PTR) { return TRUE; }
inline INT_PTR WINAPI DialogBoxParamA(HINSTANCE, LPCSTR, HWND, DLGPROC, LPARAM) { return 0; }
inline HWND WINAPI CreateDialogParamA(HINSTANCE, LPCSTR, HWND, DLGPROC, LPARAM) { return NULL; }
#define SetDlgItemText SetDlgItemTextA
#define GetDlgItemText GetDlgItemTextA
#define SendDlgItemMessage SendDlgItemMessageA
#define DialogBox(hInstance, lpTemplate, hWndParent, lpDialogFunc) DialogBoxParamA(hInstance, lpTemplate, hWndParent, lpDialogFunc, 0L)
#define CreateDialog(hInstance, lpName, hWndParent, lpDialogFunc) CreateDialogParamA(hInstance, lpName, hWndParent, lpDialogFunc, 0L)
#define MAKEINTRESOURCEA(i) ((LPSTR)((ULONG_PTR)((WORD)(i))))
#define MAKEINTRESOURCE MAKEINTRESOURCEA

inline HMENU WINAPI GetMenu(HWND) { return NULL; }
inline HMENU WINAPI GetSubMenu(HMENU, int) { return NULL; }
inline DWORD WINAPI CheckMenuItem(HMENU, UINT, UINT) { return 0; }
inline BOOL WINAPI EnableMenuItem(HMENU, UINT, UINT) { return TRUE; }
inline BOOL WINAPI EnableWindow(HWND, BOOL) { return TRUE; }
inline BOOL WINAPI IsWindow(HWND hWnd) { return hWnd != NULL; }
inline BOOL WINAPI IsWindowVisible(HWND) { return TRUE; }
inline BOOL WINAPI InvalidateRect(HWND, const RECT*, BOOL) { return TRUE; }

inline BOOL WINAPI AllocConsole(void) { return TRUE; }
inline BOOL WINAPI FreeConsole(void) { return TRUE; }
inline HANDLE WINAPI GetStdHandle(DWORD) { return (HANDLE)(intptr_t)1; }

/* Wide-char stubs for AutoPlay */
inline BOOL WINAPI SetWindowTextW(HWND, LPCWSTR) { return TRUE; }
inline int WINAPI GetWindowTextW(HWND, LPWSTR lpStr, int nMax) { if (lpStr && nMax > 0) lpStr[0] = 0; return 0; }
inline LRESULT WINAPI SendMessageW(HWND, UINT, WPARAM, LPARAM) { return 0; }
inline HWND WINAPI CreateWindowExW(DWORD, LPCWSTR, LPCWSTR, DWORD, int, int, int, int, HWND, HMENU, HINSTANCE, LPVOID) { return NULL; }
inline DWORD WINAPI GetCurrentDirectoryW(DWORD nLen, LPWSTR lpBuf) { if (lpBuf && nLen > 0) lpBuf[0] = 0; return 0; }
inline UINT WINAPI GetPrivateProfileIntW(LPCWSTR, LPCWSTR, INT nDefault, LPCWSTR) { return (UINT)nDefault; }
inline DWORD WINAPI GetPrivateProfileStringW(LPCWSTR, LPCWSTR, LPCWSTR lpDefault, LPWSTR lpReturnedString, DWORD nSize, LPCWSTR) {
    if (lpReturnedString && nSize > 0) {
        if (lpDefault) wcsncpy(lpReturnedString, lpDefault, nSize - 1);
        else lpReturnedString[0] = 0;
        lpReturnedString[nSize - 1] = 0;
    }
    return 0;
}
inline BOOL WINAPI WritePrivateProfileStringW(LPCWSTR, LPCWSTR, LPCWSTR, LPCWSTR) { return TRUE; }

inline int fopen_s(FILE** pFile, const char* filename, const char* mode) {
    if (!pFile) return EINVAL;
    *pFile = dr_wasm_fopen(filename, mode);
    return (*pFile != NULL) ? 0 : ENOENT;
}

#ifdef __cplusplus
}
template <size_t N>
inline int swprintf_s(wchar_t (&buf)[N], const wchar_t* fmt, ...) {
    va_list ap;
    va_start(ap, fmt);
    int r = vswprintf(buf, N, fmt, ap);
    va_end(ap);
    return r;
}
inline int swprintf_s(wchar_t* buf, size_t n, const wchar_t* fmt, ...) {
    va_list ap;
    va_start(ap, fmt);
    int r = vswprintf(buf, n, fmt, ap);
    va_end(ap);
    return r;
}
#endif


typedef struct tagBITMAP {
    LONG   bmType;
    LONG   bmWidth;
    LONG   bmHeight;
    LONG   bmWidthBytes;
    WORD   bmPlanes;
    WORD   bmBitsPixel;
    LPVOID bmBits;
} BITMAP, *PBITMAP, *LPBITMAP;

typedef WORD LANGID;

#define IMAGE_BITMAP        0
#define IMAGE_ICON          1
#define IMAGE_CURSOR        2
#define LR_DEFAULTCOLOR     0x00000000
#define LR_LOADFROMFILE     0x00000010
#define LR_CREATEDIBSECTION 0x00002000

#define PLANES              14
#define BITSPIXEL           12

#define SWP_NOSIZE          0x0001
#define SWP_NOMOVE          0x0002
#define SWP_NOZORDER        0x0004
#define SWP_NOACTIVATE      0x0010
#define SWP_SHOWWINDOW      0x0040
#define SWP_HIDEWINDOW      0x0080

#define CW_USEDEFAULT       ((int)0x80000000)
#define COLOR_WINDOW        5
#define COLOR_BTNFACE       15

#define BS_PUSHBUTTON       0x00000000L
#define BS_DEFPUSHBUTTON    0x00000001L
#define BS_CHECKBOX         0x00000002L
#define BS_AUTOCHECKBOX     0x00000003L
#define BS_RADIOBUTTON      0x00000004L
#define BS_GROUPBOX         0x00000007L
#define BS_AUTORADIOBUTTON  0x00000009L

#define LBS_NOTIFY          0x0001L
#define LBS_SORT            0x0002L
#define LBS_NOINTEGRALHEIGHT 0x0100L
#define LB_SETHORIZONTALEXTENT 0x0194

#define CBS_DROPDOWN        0x0002L
#define CBS_DROPDOWNLIST    0x0003L
#define CB_GETITEMDATA      0x0150
#define CB_SETITEMDATA      0x0151

#define MOVEFILE_REPLACE_EXISTING 0x00000001
#define MOVEFILE_COPY_ALLOWED     0x00000002
#define MOVEFILE_WRITE_THROUGH    0x00000008

typedef LRESULT (CALLBACK* WNDPROCW)(HWND, UINT, WPARAM, LPARAM);
typedef struct tagWNDCLASSW {
    UINT      style;
    WNDPROCW  lpfnWndProc;
    int       cbClsExtra;
    int       cbWndExtra;
    HINSTANCE hInstance;
    HICON     hIcon;
    HCURSOR   hCursor;
    HBRUSH    hbrBackground;
    LPCWSTR   lpszMenuName;
    LPCWSTR   lpszClassName;
} WNDCLASSW, *PWNDCLASSW, *LPWNDCLASSW;

#ifdef __cplusplus
extern "C" {
#endif
inline HANDLE WINAPI LoadImageA(HINSTANCE, LPCSTR, UINT, int, int, UINT) { return NULL; }
#define LoadImage LoadImageA
inline HBITMAP WINAPI LoadBitmapA(HINSTANCE, LPCSTR) { return NULL; }
#define LoadBitmap LoadBitmapA
inline int WINAPI GetObjectA(HANDLE, int, LPVOID) { return 0; }
#define GetObject GetObjectA
inline int WINAPI GetDeviceCaps(HDC, int idx) { return (idx == BITSPIXEL) ? 16 : 1; }
inline LANGID WINAPI GetSystemDefaultLangID(void) { return 0x0409; }
inline LANGID WINAPI GetUserDefaultLangID(void) { return 0x0409; }
inline DWORD WINAPI GetVersion(void) { return 0x00000005; }
inline int _fcloseall(void) { return 0; }
inline int _memicmp(const void* s1, const void* s2, size_t n) { return strncasecmp((const char*)s1, (const char*)s2, n); }
#define memicmp _memicmp

inline ATOM WINAPI RegisterClassW(const WNDCLASSW*) { return 1; }
inline LRESULT WINAPI DefWindowProcW(HWND hWnd, UINT Msg, WPARAM wParam, LPARAM lParam) { return DefWindowProcA(hWnd, Msg, wParam, lParam); }
inline DWORD WINAPI GetTempPathW(DWORD, LPWSTR lpBuf) { if (lpBuf) lpBuf[0] = 0; return 0; }
inline UINT WINAPI GetTempFileNameW(LPCWSTR, LPCWSTR, UINT, LPWSTR lpTemp) { if (lpTemp) lpTemp[0] = 0; return 0; }
inline BOOL WINAPI MoveFileExW(LPCWSTR, LPCWSTR, DWORD) { return TRUE; }
inline BOOL WINAPI DeleteFileW(LPCWSTR) { return TRUE; }
#ifdef __cplusplus
}
#endif


#define CLR_INVALID 0xFFFFFFFF
#define EXCEPTION_EXECUTE_HANDLER 1
#define EXCEPTION_CONTINUE_SEARCH 0
#define EXCEPTION_CONTINUE_EXECUTION (-1)
#define EXCEPTION_ACCESS_VIOLATION 0xC0000005L

#define WM_INITMENU         0x0116
#define LB_GETITEMDATA      0x0199
#define LB_SETITEMDATA      0x019A
#define CB_FINDSTRING       0x014C
#define EN_CHANGE           0x0300
#define LBN_SELCHANGE       1
#define SM_CYMENUSIZE       55

#define REG_OPTION_NON_VOLATILE 0x00000000L
#define STARTF_USESHOWWINDOW    0x00000001
#define NORMAL_PRIORITY_CLASS   0x00000020

typedef struct tagMINMAXINFO {
    POINT ptReserved;
    POINT ptMaxSize;
    POINT ptMaxPosition;
    POINT ptMinTrackSize;
    POINT ptMaxTrackSize;
} MINMAXINFO, *PMINMAXINFO, *LPMINMAXINFO;

typedef struct _STARTUPINFOA {
    DWORD  cb;
    LPSTR  lpReserved;
    LPSTR  lpDesktop;
    LPSTR  lpTitle;
    DWORD  dwX;
    DWORD  dwY;
    DWORD  dwXSize;
    DWORD  dwYSize;
    DWORD  dwXCountChars;
    DWORD  dwYCountChars;
    DWORD  dwFillAttribute;
    DWORD  dwFlags;
    WORD   wShowWindow;
    WORD   cbReserved2;
    LPBYTE lpReserved2;
    HANDLE hStdInput;
    HANDLE hStdOutput;
    HANDLE hStdError;
} STARTUPINFOA, STARTUPINFO, *LPSTARTUPINFOA, *LPSTARTUPINFO;

typedef struct _PROCESS_INFORMATION {
    HANDLE hProcess;
    HANDLE hThread;
    DWORD  dwProcessId;
    DWORD  dwThreadId;
} PROCESS_INFORMATION, *PPROCESS_INFORMATION, *LPPROCESS_INFORMATION;

#ifdef __cplusplus
extern "C" {
#endif
inline BOOL WINAPI StretchBlt(HDC, int, int, int, int, HDC, int, int, int, int, DWORD) { return TRUE; }
inline COLORREF WINAPI GetPixel(HDC, int, int) { return 0; }
inline COLORREF WINAPI SetPixel(HDC, int, int, COLORREF c) { return c; }
inline BOOL WINAPI IsDialogMessageA(HWND, LPMSG) { return FALSE; }
#define IsDialogMessage IsDialogMessageA
inline int WINAPI LoadStringA(HINSTANCE, UINT uID, LPSTR lpBuffer, int cchBufferMax) {
    if (lpBuffer && cchBufferMax > 0) {
        int n = snprintf(lpBuffer, (size_t)cchBufferMax, "DRAGONRAJA_RES_%u", (unsigned int)uID);
        return (n > 0) ? n : 0;
    }
    return 0;
}
#define LoadString LoadStringA
inline HRESULT WINAPI CoInitialize(LPVOID) { return S_OK; }
inline void WINAPI CoUninitialize(void) {}
inline LONG WINAPI RegCreateKeyExA(HKEY, LPCSTR, DWORD, LPSTR, DWORD, DWORD, LPVOID, PHKEY phkResult, LPDWORD lpdwDisposition) {
    if (phkResult) *phkResult = (HKEY)1;
    if (lpdwDisposition) *lpdwDisposition = 1;
    return 0;
}
inline LONG WINAPI RegOpenKeyExA(HKEY, LPCSTR, DWORD, DWORD, PHKEY phkResult) {
    if (phkResult) *phkResult = (HKEY)1;
    return 1;
}
inline LONG WINAPI RegSetValueExA(HKEY, LPCSTR, DWORD, DWORD, const BYTE*, DWORD) { return 0; }
inline LONG WINAPI RegQueryValueExA(HKEY, LPCSTR, LPDWORD, LPDWORD, LPBYTE, LPDWORD) { return 1; }
inline LONG WINAPI RegCloseKey(HKEY) { return 0; }
#define RegCreateKeyEx RegCreateKeyExA
#define RegOpenKeyEx RegOpenKeyExA
#define RegSetValueEx RegSetValueExA
#define RegQueryValueEx RegQueryValueExA
inline BOOL WINAPI CreateProcessA(LPCSTR, LPSTR, LPVOID, LPVOID, BOOL, DWORD, LPVOID, LPCSTR, LPSTARTUPINFOA, LPPROCESS_INFORMATION) { return FALSE; }
#define CreateProcess CreateProcessA
inline UINT WINAPI WinExec(LPCSTR, UINT) { return 32; }
#ifdef __cplusplus
}
#endif

#endif /* _WASM_COMPAT_WINDOWS_H_ */



