#ifndef _WASM_COMPAT_DIRECT_H_
#define _WASM_COMPAT_DIRECT_H_
#include <windows.h>
#include <sys/stat.h>
#include <unistd.h>
inline int _mkdir(const char* path) { return mkdir(path, 0777); }
inline int _rmdir(const char* path) { return rmdir(path); }
inline int _chdir(const char* path) { return chdir(path); }
inline char* _getcwd(char* buf, int size) { return getcwd(buf, size); }
#endif
