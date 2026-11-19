#include "stdafx.h"
#include "CrackMgr.h"
#include "network.h"
#include "dragon.h"
#include "CurrentMsgMgr.h"

const int CHECK_ACCEL_RECOMMAND_TIME = 30000;

CCrackMgr CrackMgr;
CCrackMgr::CCrackMgr()
{
	m_i64Clock = 0;
	m_hCrackThread = INVALID_HANDLE_VALUE;
	SetThreadApplyGab(0);
	SetCTRun(true);
}

CCrackMgr::~CCrackMgr()
{
}

void CCrackMgr::InitCrackMgr()
{
	::memset(&RecvPacketSave, 0, sizeof(t_server_check_accel));
	dwRecommandTime = 0;
	dwRealTime = 0;
	dwRecvedTime = 0;
}

void CCrackMgr::RecvCheckAccel(t_server_check_accel *packet)
{
	dwRealTime = timeGetTime();
	RecvPacketSave = *packet;
	dwRecvedTime = dwRealTime;
	dwRecommandTime = dwRealTime + CHECK_ACCEL_RECOMMAND_TIME;
}

void CCrackMgr::AutoCheckAccel()
{
	const int iResult = (int)((int)dwRealTime - (int)dwRecommandTime);
	dwRealTime = timeGetTime();
	if (dwRecommandTime && dwRecvedTime)
	{
		if (0 < iResult)
		{
			t_packet packet;
			packet.h.header.type = CMD_CHECK_ACCEL;
			packet.h.header.size = sizeof(t_server_check_accel);
			memcpy(&packet.u.server_check_accel, &RecvPacketSave, sizeof(t_server_check_accel));
			QueuePacket(&packet, 1);
			InitCrackMgr();
		}
	}
}

void CCrackMgr::SetInitClock()
{
	m_i64Clock = GetAverageClock();
}

__int64 CCrackMgr::GetAverageClock()
{
	return 1000000;
}

void __stdcall CCrackMgr::GetNowClock(CLOCK* pClock)
{
	if (pClock)
	{
		pClock->dwLow = timeGetTime();
		pClock->dwHi = 0;
	}
}

bool CCrackMgr::StartCrackThread()
{
	SetCTRun(true);
	return true;
}

bool CCrackMgr::StopCrackThread()
{
	SetCTRun(false);
	return true;
}

bool CCrackMgr::IsCrackThreadRun()
{
	return true;
}

unsigned __stdcall CrackCheckThread(LPVOID pValue)
{
	(void)pValue;
	return 0;
}

BOOL DumpException(LPEXCEPTION_POINTERS lpExcep, char* szOutMsg)
{
	(void)lpExcep;
	(void)szOutMsg;
	return FALSE;
}
