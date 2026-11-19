#ifndef _WASM_CRTDBG_H_
#define _WASM_CRTDBG_H_
#define _ASSERT(expr) ((void)0)
#define _ASSERTE(expr) ((void)0)
#define _CrtCheckMemory() 1
#define _CrtSetDbgFlag(f) 0
#define _CrtDumpMemoryLeaks() 0
#endif
