#ifndef _WASM_COMPAT_TLHELP32_H_
#define _WASM_COMPAT_TLHELP32_H_
#include <windows.h>

#define TH32CS_SNAPHEAPLIST 0x00000001
#define TH32CS_SNAPPROCESS  0x00000002
#define TH32CS_SNAPTHREAD   0x00000004
#define TH32CS_SNAPMODULE   0x00000008
#define TH32CS_SNAPALL      (TH32CS_SNAPHEAPLIST | TH32CS_SNAPPROCESS | TH32CS_SNAPTHREAD | TH32CS_SNAPMODULE)

typedef struct tagPROCESSENTRY32 {
    DWORD     dwSize;
    DWORD     cntUsage;
    DWORD     th32ProcessID;
    ULONG_PTR th32DefaultHeapID;
    DWORD     th32ModuleID;
    DWORD     cntThreads;
    DWORD     th32ParentProcessID;
    LONG      pcPriClassBase;
    DWORD     dwFlags;
    CHAR      szExeFile[MAX_PATH];
} PROCESSENTRY32, *PPROCESSENTRY32, *LPPROCESSENTRY32;

#ifdef __cplusplus
extern "C" {
#endif
inline HANDLE WINAPI CreateToolhelp32Snapshot(DWORD, DWORD) { return INVALID_HANDLE_VALUE; }
inline BOOL WINAPI Process32First(HANDLE, LPPROCESSENTRY32) { return FALSE; }
inline BOOL WINAPI Process32Next(HANDLE, LPPROCESSENTRY32) { return FALSE; }
#ifdef __cplusplus
}
#endif

#endif
