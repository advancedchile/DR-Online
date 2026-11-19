#ifndef _WASM_COMPAT_PROCESS_H_
#define _WASM_COMPAT_PROCESS_H_
#include <windows.h>
inline uintptr_t _beginthread(void (*start_address)(void *), unsigned stack_size, void *arglist) { return 0; }
inline uintptr_t _beginthreadex(void *security, unsigned stack_size, unsigned (*start_address)(void *), void *arglist, unsigned initflag, unsigned *thrdaddr) { return 0; }
inline void _endthread(void) {}
inline void _endthreadex(unsigned retval) {}
#endif
