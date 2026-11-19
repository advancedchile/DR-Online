#ifndef _WASM_COMPAT_SQLTYPES_H_
#define _WASM_COMPAT_SQLTYPES_H_
#include <windows.h>

typedef unsigned char   SQLCHAR;
typedef signed char     SQLSCHAR;
typedef unsigned char   SQLDATE;
typedef unsigned char   SQLDECIMAL;
typedef double          SQLDOUBLE;
typedef double          SQLFLOAT;
typedef int32_t         SQLINTEGER;
typedef uint32_t        SQLUINTEGER;
typedef int16_t         SQLSMALLINT;
typedef uint16_t        SQLUSMALLINT;
typedef void*           SQLPOINTER;
typedef float           SQLREAL;
typedef unsigned char   SQLTIME;
typedef unsigned char   SQLTIMESTAMP;
typedef unsigned char   SQLVARCHAR;
typedef SQLSMALLINT     SQLRETURN;
typedef void*           SQLHANDLE;
typedef SQLHANDLE       SQLHENV;
typedef SQLHANDLE       SQLHDBC;
typedef SQLHANDLE       SQLHSTMT;
typedef SQLHANDLE       SQLHDESC;
typedef HWND            SQLHWND;

typedef struct tagDATE_STRUCT {
    SQLSMALLINT  year;
    SQLUSMALLINT month;
    SQLUSMALLINT day;
} DATE_STRUCT, SQL_DATE_STRUCT;

typedef struct tagTIME_STRUCT {
    SQLUSMALLINT hour;
    SQLUSMALLINT minute;
    SQLUSMALLINT second;
} TIME_STRUCT, SQL_TIME_STRUCT;

typedef struct tagTIMESTAMP_STRUCT {
    SQLSMALLINT  year;
    SQLUSMALLINT month;
    SQLUSMALLINT day;
    SQLUSMALLINT hour;
    SQLUSMALLINT minute;
    SQLUSMALLINT second;
    SQLUINTEGER  fraction;
} TIMESTAMP_STRUCT, SQL_TIMESTAMP_STRUCT;

#define SQL_SUCCESS             0
#define SQL_SUCCESS_WITH_INFO   1
#define SQL_NO_DATA             100
#define SQL_ERROR               (-1)
#define SQL_INVALID_HANDLE      (-2)
#define SQL_STILL_EXECUTING     2
#define SQL_NEED_DATA           99
#define SQL_NTS                 (-3)
#define SQL_NULL_DATA           (-1)
#define SQL_C_CHAR              1
#define SQL_C_LONG              4
#define SQL_C_SLONG             (-16)
#define SQL_C_SSHORT            (-15)
#define SQL_C_STINYINT          (-26)
#define SQL_C_BINARY            (-2)
#define SQL_C_TIMESTAMP         11

#endif
