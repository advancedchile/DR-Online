#ifndef _WASM_COMPAT_WINDOWSX_H_
#define _WASM_COMPAT_WINDOWSX_H_
#include <windows.h>
#define GET_X_LPARAM(lp) ((int)(short)LOWORD(lp))
#define GET_Y_LPARAM(lp) ((int)(short)HIWORD(lp))
#define GlobalAllocPtr(flags, cb) (GlobalLock(GlobalAlloc((flags), (cb))))
#define GlobalFreePtr(lp) (GlobalUnlock((HGLOBAL)(lp)), (BOOL)(uintptr_t)GlobalFree((HGLOBAL)(lp)))
#define Edit_SetText(hwndCtl, lpsz) SetWindowText((hwndCtl), (lpsz))
#define Edit_GetText(hwndCtl, lpch, cchMax) GetWindowText((hwndCtl), (lpch), (cchMax))
#define Edit_GetTextLength(hwndCtl) GetWindowTextLength(hwndCtl)
#define Edit_LimitText(hwndCtl, cchMax) ((void)0)

#define Edit_GetLineCount(hwndCtl) 1
#define Edit_GetLine(hwndCtl, line, lpch, cchMax) GetWindowText((hwndCtl), (lpch), (cchMax))
#define Edit_ReplaceSel(hwndCtl, lpszReplace) SetWindowText((hwndCtl), (LPCSTR)(lpszReplace))
#define Button_SetCheck(hwndCtl, check) ((void)0)
#define Button_GetCheck(hwndCtl) 0

#endif
