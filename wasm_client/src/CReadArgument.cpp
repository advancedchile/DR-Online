#include "Stdafx.h"
#include "CReadArgument.h"

HINSTANCE hDll = NULL;
SessionParameter m_SessParam = {0};
CClientBill *g_pBill = NULL;
CUnicheck *g_unitel = NULL;

CClientBill::CClientBill(const char *szLine)
{
	(void)szLine;
	memset(UserID, 0, sizeof(UserID));
	memset(UserPW, 0, sizeof(UserPW));
	memset(IP, 0, sizeof(IP));
	memset(m_szJapanTID, 0, sizeof(m_szJapanTID));
	port = 0;
}

CClientBill::CClientBill()
{
	memset(UserID, 0, sizeof(UserID));
	memset(UserPW, 0, sizeof(UserPW));
	memset(IP, 0, sizeof(IP));
	memset(m_szJapanTID, 0, sizeof(m_szJapanTID));
	port = 0;
}

CClientBill::~CClientBill()
{
}
