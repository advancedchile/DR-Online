#if !defined(AFX_READARGUMENT_H__01911661_5F5A_426F_8E7B_2C16589738DD__INCLUDED_)
#define AFX_READARGUMENT_H__01911661_5F5A_426F_8E7B_2C16589738DD__INCLUDED_

#include "dragon.h"
#include "chigamec.h"

BOOL WINAPI DecryptFunc(LPTSTR cipher_text, LPTSTR plain_text);

const int MAX_BILL_BUFFER = 255;
const int MAX_TID = 50;
const int MAX_BILL_CORP = 16;

enum ePayCompanyType
{
	Nownuri = 0,
	Thrunet = 1,
	Channel_i = 2,
	Unitel = 3,
	Netsgo = 4,
	KornetWorld = 5,
	Mezzy = 6,
	Wever = 7,
	WiseTop = 8,
	MediaWeb = 9,
	PcBangDotCom = 10,
	OneGame = 11,
	ExciteGame = 12,
	UnitelWeb = 13,
	Chollian = 14,
	HyunJuComputer = 15,
};

extern HINSTANCE hDll;
extern SessionParameter m_SessParam;

#define MAX_USERID 25
#define MAX_USERNAME 30
#define UM_CLOSENOTIFY (WM_USER + 1052)
#define UM_TERMINATENOTIFY (WM_USER + 1053)
#define STRING_TERMINATEEVENT "THREAD_THERMINATEEVENT"

struct STRUCTCHECKUNIPARAM
{
	HWND hWndReceiveWindow;
	UINT nSendToMessage;
};

class CUnicheck
{
public:
	char UnitelIP[40];
	BOOL Uniwin_RunningStatus;
	char Uniwin_szpUserID[100];
	char Uniwin_szpUserName[100];
	HWND Uniwin_m_hWnd;

	BOOL Uniwin_StartCheckUniwin(HWND hReceiveWindow, UINT nReceiveMessage) { (void)hReceiveWindow; (void)nReceiveMessage; return FALSE; }
	void Uniwin_TerminateCheckUniwin() {}
	void Uniwin_GetUniwinInfo() {}
	void Uniwin_Init(HWND hwnd) { (void)hwnd; }
	char* ReturnUniteIP(char *Name) { (void)Name; return UnitelIP; }
	CUnicheck() { memset(this, 0, sizeof(*this)); }
	~CUnicheck() {}
};

#ifndef __CClinetBill__
#define __CClinetBill__
class CClientBill
{
public:
	char UserID[40];
	char UserPW[40];
	char IP[40];
	int port;
	char m_szJapanTID[100];

	CClientBill(const char *szLine);
	CClientBill();
	~CClientBill();

	int CloseSocket() { return 0; }
	char* Unitel_ID() { return UserID; }
	int ReturnLineNum() { return -1; }
	char* ReturnCharValue(int Where) { (void)Where; return UserID; }
	int ReturnNumValue(int Where) { (void)Where; return 0; }
	int ReturnHeader() { return -1; }
	char* ReturnUserID() { return UserID; }
	char* ReturnUserPW() { return UserPW; }
	void DisplayAllCommand() {}
	void HeartBeatToOtherSocket() {}
	void HeartBeatToGameSocket() {}
	char* ReturnIPaddress() { return IP; }
	char* ReturnPayIPaddress() { return IP; }
	int ReturnPORTNumber() { return port; }
	int ReturnPayPORTNumber() { return port; }
	int SendSpecifiedMessage(HWND hwnd) { (void)hwnd; return 0; }
	char* GetJapanTID() { return m_szJapanTID; }
};
#endif

extern CClientBill *g_pBill;
extern CUnicheck *g_unitel;

#endif
