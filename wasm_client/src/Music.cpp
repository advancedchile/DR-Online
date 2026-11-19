#include "stdafx.h"
#include "Music.h"

extern "C" void dr_wasm_play_bgm(const char* path, int loop);
extern "C" void dr_wasm_stop_bgm(void);

CMusic cMusic;
CMusic* pMusic = &cMusic;

CMusic::CMusic()
{
	m_State = Uninitialized;
	m_pGraph = NULL;
	m_hGraphNotifyEvent = NULL;
}

CMusic::~CMusic()
{
	DeleteContents();
}

BOOL CMusic::CreateFilterGraph(void)
{
	m_State = Stopped;
	return TRUE;
}

void CMusic::DeleteContents(void)
{
	m_State = Uninitialized;
	m_pGraph = NULL;
}

BOOL CMusic::OpenFile(LPCTSTR lpszPathName)
{
	if (!lpszPathName || !lpszPathName[0]) return FALSE;
	m_State = Stopped;
	dr_wasm_play_bgm(lpszPathName, 1);
	return TRUE;
}

void CMusic::Play()
{
	m_State = Playing;
}

void CMusic::Pause()
{
	if (m_State == Playing) {
		m_State = Paused;
		dr_wasm_stop_bgm();
	}
}

void CMusic::Stop()
{
	if (m_State == Playing || m_State == Paused) {
		m_State = Stopped;
		dr_wasm_stop_bgm();
	}
}

void CMusic::AbortStop()
{
	Stop();
}

void CMusic::OnGraphNotify()
{
}
