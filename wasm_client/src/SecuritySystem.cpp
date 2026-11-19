#include "stdafx.h"
#include "SecuritySystem.h"

CSecuritySystem::CSecuritySystem()
{
	m_hSafeWnd = NULL;
	m_szTempName[0] = 0;
}

CSecuritySystem::~CSecuritySystem()
{
	Disconnect();
}

int CSecuritySystem::Connect(HWND hWnd)
{
	m_hSafeWnd = hWnd;
	return 1;
}

void CSecuritySystem::Disconnect()
{
}

bool CSecuritySystem::CheckFileName(const char* pFileName)
{
	return true;
}

HWND CSecuritySystem::GetDragonHwnd()
{
	return NULL;
}

bool CSecuritySystem::MakeExeFile(int idResource, const char* pFileName)
{
	return true;
}
