#ifndef _WASM_COMPAT_WINSOCK2_H_
#define _WASM_COMPAT_WINSOCK2_H_
#include <windows.h>

typedef unsigned char u_char;
typedef unsigned short u_short;
typedef unsigned int u_int;
typedef unsigned long u_long;
typedef int SOCKET;
#define WINSOCK_VERSION 0x0202
#define INVALID_SOCKET  (SOCKET)(~0)
#define SOCKET_ERROR    (-1)

#define AF_INET         2
#define PF_INET         AF_INET
#define SOCK_STREAM     1
#define SOCK_DGRAM      2
#define IPPROTO_TCP     6
#define IPPROTO_UDP     17

#define INADDR_ANY      (uint32_t)0x00000000
#define INADDR_BROADCAST (uint32_t)0xffffffff
#define INADDR_NONE     0xffffffff

#define FIONREAD        0x4004667f
#define FIONBIO         0x8004667e
#define SOL_SOCKET      0xffff
#define SO_REUSEADDR    0x0004
#define SO_KEEPALIVE    0x0008
#define SO_SNDBUF       0x1001
#define SO_RCVBUF       0x1002
#define SO_ERROR        0x1007
#define SO_LINGER       0x0080
#define TCP_NODELAY     0x0001
#define SD_RECEIVE      0x00
#define SD_SEND         0x01
#define SD_BOTH         0x02

#define WSABASEERR              10000
#define WSAEINTR                (WSABASEERR+4)
#define WSAEWOULDBLOCK          (WSABASEERR+35)
#define WSAEINPROGRESS          (WSABASEERR+36)
#define WSAEALREADY             (WSABASEERR+37)
#define WSAENOTSOCK             (WSABASEERR+38)
#define WSAEMSGSIZE             (WSABASEERR+40)
#define WSAECONNRESET           (WSABASEERR+54)
#define WSAENOBUFS              (WSABASEERR+55)
#define WSAEISCONN              (WSABASEERR+56)
#define WSAENOTCONN             (WSABASEERR+57)
#define WSAETIMEDOUT            (WSABASEERR+60)
#define WSAECONNREFUSED         (WSABASEERR+61)
#define WSAEACCES               (WSABASEERR+13)
#define WSAEFAULT               (WSABASEERR+14)
#define WSAEINVAL               (WSABASEERR+22)
#define WSAEMFILE               (WSABASEERR+24)
#define WSAEPROTOTYPE           (WSABASEERR+41)
#define WSAENOPROTOOPT          (WSABASEERR+42)
#define WSAEPROTONOSUPPORT      (WSABASEERR+43)
#define WSAESOCKTNOSUPPORT      (WSABASEERR+44)
#define WSAEOPNOTSUPP           (WSABASEERR+45)
#define WSAEPFNOSUPPORT         (WSABASEERR+46)
#define WSAEAFNOSUPPORT         (WSABASEERR+47)
#define WSAEADDRINUSE           (WSABASEERR+48)
#define WSAEADDRNOTAVAIL        (WSABASEERR+49)
#define WSAENETDOWN             (WSABASEERR+50)
#define WSAENETUNREACH          (WSABASEERR+51)
#define WSAENETRESET            (WSABASEERR+52)
#define WSAECONNABORTED         (WSABASEERR+53)
#define WSAESHUTDOWN            (WSABASEERR+58)
#define WSAETOOMANYREFS         (WSABASEERR+59)
#define WSAELOOP                (WSABASEERR+62)
#define WSAENAMETOOLONG         (WSABASEERR+63)
#define WSAEHOSTDOWN            (WSABASEERR+64)
#define WSAEHOSTUNREACH         (WSABASEERR+65)
#define WSASYSNOTREADY          (WSABASEERR+91)
#define WSAVERNOTSUPPORTED      (WSABASEERR+92)
#define WSANOTINITIALISED       (WSABASEERR+93)

typedef struct WSAData {
    WORD wVersion;
    WORD wHighVersion;
    char szDescription[257];
    char szSystemStatus[129];
    unsigned short iMaxSockets;
    unsigned short iMaxUdpDg;
    char* lpVendorInfo;
} WSADATA, *LPWSADATA;

struct in_addr {
    union {
        struct { uint8_t s_b1, s_b2, s_b3, s_b4; } S_un_b;
        struct { uint16_t s_w1, s_w2; } S_un_w;
        uint32_t S_addr;
    } S_un;
#define s_addr S_un.S_addr
};

struct sockaddr_in {
    short sin_family;
    unsigned short sin_port;
    struct in_addr sin_addr;
    char sin_zero[8];
};
typedef struct sockaddr_in SOCKADDR_IN;
typedef struct sockaddr_in *PSOCKADDR_IN;
typedef struct sockaddr_in *LPSOCKADDR_IN;

struct sockaddr {
    unsigned short sa_family;
    char sa_data[14];
};
typedef struct sockaddr SOCKADDR;
typedef struct sockaddr *PSOCKADDR;
typedef struct sockaddr *LPSOCKADDR;

struct hostent {
    char* h_name;
    char** h_aliases;
    short h_addrtype;
    short h_length;
    char** h_addr_list;
#define h_addr h_addr_list[0]
};
typedef struct hostent HOSTENT;
typedef struct hostent *PHOSTENT;
typedef struct hostent *LPHOSTENT;

struct linger {
    uint16_t l_onoff;
    uint16_t l_linger;
};
typedef struct linger LINGER;

#ifndef _STRUCT_TIMEVAL
#define _STRUCT_TIMEVAL
struct timeval {
    long tv_sec;
    long tv_usec;
};
#endif

#ifndef FD_SETSIZE
#define FD_SETSIZE 64
#endif
typedef struct fd_set_wasm {
    unsigned int fd_count;
    SOCKET fd_array[FD_SETSIZE];
} fd_set_wasm;
#define fd_set fd_set_wasm

#undef FD_ZERO
#undef FD_SET
#undef FD_CLR
#undef FD_ISSET
#define FD_ZERO(set) (((fd_set_wasm*)(set))->fd_count = 0)
#define FD_SET(fd, set) do { \
    if (((fd_set_wasm*)(set))->fd_count < FD_SETSIZE) \
        ((fd_set_wasm*)(set))->fd_array[((fd_set_wasm*)(set))->fd_count++] = (fd); \
} while(0)
#define FD_CLR(fd, set) do { \
    for (unsigned int __i = 0; __i < ((fd_set_wasm*)(set))->fd_count; __i++) { \
        if (((fd_set_wasm*)(set))->fd_array[__i] == (fd)) { \
            ((fd_set_wasm*)(set))->fd_array[__i] = ((fd_set_wasm*)(set))->fd_array[--((fd_set_wasm*)(set))->fd_count]; \
            break; \
        } \
    } \
} while(0)
int __wasm_fd_isset(SOCKET fd, fd_set_wasm* set);
#define FD_ISSET(fd, set) __wasm_fd_isset((fd), (fd_set_wasm*)(set))

#ifdef __cplusplus
extern "C" {
#endif
int WINAPI WSAStartup(WORD wVersionRequested, LPWSADATA lpWSAData);
int WINAPI WSACleanup(void);
int WINAPI WSAGetLastError(void);
void WINAPI WSASetLastError(int iError);

SOCKET WINAPI socket(int af, int type, int protocol);
int WINAPI closesocket(SOCKET s);
int WINAPI connect(SOCKET s, const struct sockaddr* name, int namelen);
int WINAPI bind(SOCKET s, const struct sockaddr* name, int namelen);
int WINAPI listen(SOCKET s, int backlog);
SOCKET WINAPI accept(SOCKET s, struct sockaddr* addr, int* addrlen);
int WINAPI send(SOCKET s, const char* buf, int len, int flags);
int WINAPI recv(SOCKET s, char* buf, int len, int flags);
int WINAPI sendto(SOCKET s, const char* buf, int len, int flags, const struct sockaddr* to, int tolen);
int WINAPI recvfrom(SOCKET s, char* buf, int len, int flags, struct sockaddr* from, int* fromlen);
int WINAPI select(int nfds, fd_set* readfds, fd_set* writefds, fd_set* exceptfds, const struct timeval* timeout);
int WINAPI ioctlsocket(SOCKET s, long cmd, u_long* argp);
int WINAPI setsockopt(SOCKET s, int level, int optname, const char* optval, int optlen);
int WINAPI getsockopt(SOCKET s, int level, int optname, char* optval, int* optlen);
int WINAPI shutdown(SOCKET s, int how);

uint16_t WINAPI htons(uint16_t hostshort);
uint32_t WINAPI htonl(uint32_t hostlong);
uint16_t WINAPI ntohs(uint16_t netshort);
uint32_t WINAPI ntohl(uint32_t netlong);
uint32_t WINAPI inet_addr(const char* cp);
char* WINAPI inet_ntoa(struct in_addr in);
struct hostent* WINAPI gethostbyname(const char* name);
/* gethostname in unistd.h */
#ifdef __cplusplus
}
#endif
#ifdef __cplusplus
inline int ioctlsocket(SOCKET s, long cmd, DWORD* argp) {
    return ioctlsocket(s, cmd, (u_long*)argp);
}
#endif
#endif
