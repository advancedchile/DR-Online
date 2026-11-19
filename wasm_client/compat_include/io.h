#ifndef _WASM_COMPAT_IO_H_
#define _WASM_COMPAT_IO_H_
#include <windows.h>
#include <unistd.h>
#define _access access
#define _close close
#define _read read
#define _write write
#define _lseek lseek
struct _finddata_t {
    unsigned attrib;
    time_t time_create;
    time_t time_access;
    time_t time_write;
    unsigned long size;
    char name[260];
};
#define _A_NORMAL 0x00
#define _A_RDONLY 0x01
#define _A_HIDDEN 0x02
#define _A_SYSTEM 0x04
#define _A_SUBDIR 0x10
#define _A_ARCH   0x20
inline intptr_t _findfirst(const char*, struct _finddata_t*) { return -1; }
inline int _findnext(intptr_t, struct _finddata_t*) { return -1; }
inline int _findclose(intptr_t) { return 0; }
#endif
