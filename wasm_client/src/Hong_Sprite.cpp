/*****************************************************************************\
* Copyright (c), Future Entertainment World / Seoul, Republic of Korea        *
* All Rights Reserved.                                                        *
*                                                                             *
* This document contains proprietary and confidential information.  No        *
* parts of this document or the computer program it embodies may be in        *
* any way copied, duplicated, reproduced, translated into a different         *
* programming language, or distributed to any person, company, or             *
* corporation without the prior written consent of Future Entertainment World *
\*****************************************************************************/


#include "stdafx.h"
#include "AnimationTableLoader.h"
#include <windows.h>
#include <windowsx.h>
#include <ddraw.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <Io.h>
#include <Math.h>


#include "Dragon.h"
#include "Char.h"
#include "GameProc.h"
#include "Map.h"
#include "Hangul.h"
#include "Tool.h"

#include "DirectSound.h"

#define __HONG_SPRITE_H__
#include "Hong_Sprite.h"
#include "Hong_Light.h"
#include "Hong_Sub.h"

#include "Convert565to555.h"
#include "MouseCursor.h"
#include "Effect.h"


extern CHARACTERLIST		g_CharacterList;

WORD	AddTableR[128];
WORD	AddTableG[256];
WORD	AddTableB[128];

WORD	SubTableR[64];
//WORD	SubTableg[64];
WORD	SubTableG[128];
WORD	SubTableB[64];

bool	StartLoadCharSpriteDataThreadFlag;
bool	LoadingCharSpriteData;
bool g_bStopWeatherSystem = false; // CSD-CN-031215
bool g_bOffWeatherSystem = false; // CSD-CN-031217

/////////////////////
char *GetSurfacePointer(LPDIRECTDRAWSURFACE  pSurface)
{	
    char *buf;
    DDSURFACEDESC ddSurfaceDesc;
    
	memset(&ddSurfaceDesc, 0, sizeof(DDSURFACEDESC));
    ddSurfaceDesc.dwSize = sizeof(DDSURFACEDESC);
    HRESULT result;
    result = pSurface->Lock(NULL, &ddSurfaceDesc, DDLOCK_SURFACEMEMORYPTR | DDLOCK_WAIT, NULL);
	
	buf = (char *)ddSurfaceDesc.lpSurface;
	
	if ( buf == NULL )
	{
		result = RestoreAllSurfaces(  &g_DirectDrawInfo );
		memset(&ddSurfaceDesc, 0, sizeof(DDSURFACEDESC));
		ddSurfaceDesc.dwSize = sizeof(DDSURFACEDESC);
		HRESULT result;
		result = pSurface->Lock(NULL, &ddSurfaceDesc, DDLOCK_SURFACEMEMORYPTR | DDLOCK_WAIT, NULL);
	}
	
    pSurface->Unlock( NULL ); //ddSurfaceDesc.lpSurface);
	
	return buf;
}	



//		
// Return:	8	256 Color
//			16	High Color
//			24	24Bits Color
//			32	32Bits Color
int	GetBitsPerPixel( void )
{	
	HDC		hDC;
	int		nBitPerPixel;
	
	hDC = GetDC( NULL );
	nBitPerPixel = GetDeviceCaps( hDC, PLANES ) * GetDeviceCaps( hDC, BITSPIXEL );
	ReleaseDC( NULL, hDC );
	
	return	nBitPerPixel;
}		





void	CheckColorBitMask(  LPDIRECTDRAWSURFACE  surface )
{		
	DDSURFACEDESC ddSurfaceDesc;
	
	ZeroMemory( &ddSurfaceDesc, sizeof( DDSURFACEDESC ) );
	ddSurfaceDesc.dwSize  = sizeof( ddSurfaceDesc );
	//ddSurfaceDesc.dwFlags = DDSD_PIXELFORMAT | DDSD_PITCH;
	HRESULT hResult = surface->GetSurfaceDesc( &ddSurfaceDesc );
	
	if( g_DirectDrawInfo.bFullscreen )
	{	
		FILE *fp = Fopen( "c:/dxsize.txt", "wt" );
		wSurDxSize = (WORD)ddSurfaceDesc.lPitch;
		dSurDxSize = (DWORD)ddSurfaceDesc.lPitch;
		
		fprintf( fp, "%d %d \n", wDxSize, dSurDxSize );
		fclose(fp);
	}	
	else 
	{	
		wDxSize = SCREEN_WIDTH * 2;
		dDxSize = SCREEN_WIDTH * 2;
	}	
	
	wDxSize = SCREEN_WIDTH * 2;
	dDxSize = SCREEN_WIDTH * 2;
	
	if (hResult != 0)//DD_OK)
		return;
	
	_PixelInfo.BitMaskR = ddSurfaceDesc.ddpfPixelFormat.dwRBitMask;
	_PixelInfo.BitMaskG = ddSurfaceDesc.ddpfPixelFormat.dwGBitMask;
	_PixelInfo.BitMaskB = ddSurfaceDesc.ddpfPixelFormat.dwBBitMask; 
	
	if (_PixelInfo.BitMaskR == 0xF800) 
	{	
		// 요거이 RGB 5:6:5 포맷이니끼리 그렇게 알라우.
		//			 4444----3333----2222----1111----
		//           84218421842184218421842184218421
		//           00000000000000011111011111011110;
		_PixelInfo.ShiftRightR = 11;
		_PixelInfo.ShiftLeftR  = 0;
		
		_PixelInfo.ShiftRightG = 5;
		_PixelInfo.ShiftLeftG  = 5;
		
		_PixelInfo.ShiftRightB = 0;
		_PixelInfo.ShiftLeftB  = 11;
	}else
		if (_PixelInfo.BitMaskR == 0x7C00) 
		{	
			// 요고 RGB 5:5:5 포맷 아이가.
			//			   4444----3333----2222----1111----
			//             84218421842184218421842184218421
			//             00000000000000001111101111011110;
			_PixelInfo.ShiftRightR = 10;
			_PixelInfo.ShiftLeftR  = 1;
			
			_PixelInfo.ShiftRightG = 5;
			_PixelInfo.ShiftLeftG  = 6;
			
			_PixelInfo.ShiftRightB = 0;
			_PixelInfo.ShiftLeftB  = 11;
		}else
			if (_PixelInfo.BitMaskR == 0x001F)
			{	
				// 아따 요것 BGR 5:6:5 포맷이것제.
				//			   4444----3333----2222----1111----
				//             84218421842184218421842184218421
				_PixelInfo.ShiftRightR = 0;
				_PixelInfo.ShiftLeftR  = 11;
				
				_PixelInfo.ShiftRightG = 5;
				_PixelInfo.ShiftLeftG  = 5;
				
				_PixelInfo.ShiftRightB = 11;
				_PixelInfo.ShiftLeftB  = 0;
			}	
}		




void	InitSpriteTransTable( LPDIRECTDRAWSURFACE  surface )
{		
	CheckColorBitMask( surface );
	
	WORD	MaskG;
	if( _PixelInfo.BitMaskR == 0x7c00)
	{	
		MaskG = 0x1f;
	}	
	else
	{	
		MaskG = 0x3f;
	}	
	
	//Make ADD Table
	int i=0;
	for(i=0; i < 128; i++){
		if(i<32)
		{
			AddTableR[i] = i << _PixelInfo.ShiftRightR;
			AddTableB[i] = i << _PixelInfo.ShiftRightB;
		}	
		else
		{
			AddTableR[i] = 0x1f << _PixelInfo.ShiftRightR;
			AddTableB[i] = 0x1f << _PixelInfo.ShiftRightB;
		}
	}	
	for(i=0; i < 256; i++){
		if(i<=MaskG)
		{
			AddTableG[i] = i << _PixelInfo.ShiftRightG;
		}
		else
		{
			AddTableG[i] = MaskG << _PixelInfo.ShiftRightG;
		}
	}	
	
	//Make SUB Table
	for( i=0 ; i < 64 ; i++ ){
		if(i<32)
		{
			SubTableR[i] = 0;
			SubTableB[i] = 0;
		}
		else
		{
			SubTableR[i] = (i - 32) << _PixelInfo.ShiftRightR;
			SubTableB[i] = (i - 32) << _PixelInfo.ShiftRightB;
		}
		//SubTableG[i] = i << _PixelInfo.ShiftRightG;
		//SubTableg[i] = 0;
	}
	for(i=0; i < 128; i++){
		if(i<64)
		{
			SubTableG[i] = 0;
		}
		else
		{
			SubTableG[i] = (i - 64) << _PixelInfo.ShiftRightG;
		}
	}
}


//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//
//           Put Sprite Transperensy..
//
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

extern int tilewavetable[400];

static inline const unsigned char* SkipCompressedLines(const unsigned char* esi, int count) {
	while (count > 0) {
		while (*(const WORD*)esi != 0xFFFF) {
			WORD runBytes = *(const WORD*)(esi + 2);
			esi += 4 + runBytes;
		}
		esi += 2;
		count--;
	}
	return esi;
}

template <typename PixelOp>
static inline void RunCmprsClipped(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, PixelOp op, int rowOffsetMode = 0) {
	if (Stmp == NULL || dest == NULL || by <= 0 || rx <= 0) return;
	const unsigned char* esi = SkipCompressedLines((const unsigned char*)Stmp, ty);
	char* rowBase = (char*)dest + y * dDxSize + x * 2;
	int maxX = lx + rx;
	int waveIdx = WaveTileStart;
	for (int row = 0; row < by; row++) {
		waveIdx++;
		int extraBytes = (rowOffsetMode == 1) ? tilewavetable[waveIdx & 255] : 0;
		WORD* rowDst = (WORD*)(rowBase + extraBytes);
		int curX = 0;
		while (*(const WORD*)esi != 0xFFFF) {
			int skipPixels = (*(const WORD*)esi) >> 1;
			int runBytes = *(const WORD*)(esi + 2);
			int runPixels = runBytes >> 1;
			const WORD* srcPixels = (const WORD*)(esi + 4);
			esi += 4 + runBytes;
			curX += skipPixels;
			int startX = curX;
			int endX = curX + runPixels;
			curX = endX;
			int visStart = (startX < lx) ? lx : startX;
			int visEnd = (endX > maxX) ? maxX : endX;
			if (visStart < visEnd) {
				const WORD* s = srcPixels + (visStart - startX);
				WORD* d = rowDst + (visStart - lx);
				int cnt = visEnd - visStart;
				for (int i = 0; i < cnt; i++) {
					op(&d[i], s[i]);
				}
			}
		}
		esi += 2;
		rowBase += dDxSize;
	}
}

static inline WORD BlendPixel565(WORD src, WORD dst, DWORD alpha) {
	int sr = (src >> 11) & 0x1F, sg = (src >> 5) & 0x3F, sb = src & 0x1F;
	int dr = (dst >> 11) & 0x1F, dg = (dst >> 5) & 0x3F, db = dst & 0x1F;
	int r = dr + (((sr - dr) * (int)alpha) >> 5);
	int g = dg + (((sg - dg) * (int)alpha) >> 5);
	int b = db + (((sb - db) * (int)alpha) >> 5);
	return (WORD)(((r & 0x1F) << 11) | ((g & 0x3F) << 5) | (b & 0x1F));
}

static inline WORD BlendPixel555(WORD src, WORD dst, DWORD alpha) {
	int sr = (src >> 10) & 0x1F, sg = (src >> 5) & 0x1F, sb = src & 0x1F;
	int dr = (dst >> 10) & 0x1F, dg = (dst >> 5) & 0x1F, db = dst & 0x1F;
	int r = dr + (((sr - dr) * (int)alpha) >> 5);
	int g = dg + (((sg - dg) * (int)alpha) >> 5);
	int b = db + (((sb - db) * (int)alpha) >> 5);
	return (WORD)(((r & 0x1F) << 10) | ((g & 0x1F) << 5) | (b & 0x1F));
}

static inline WORD AddPixel565(WORD src, WORD dst, DWORD alpha) {
	int sr = (((src >> 11) & 0x1F) * (int)alpha) >> 4;
	int sg = (((src >> 5) & 0x3F) * (int)alpha) >> 4;
	int sb = ((src & 0x1F) * (int)alpha) >> 4;
	int r = ((dst >> 11) & 0x1F) + sr; if (r > 31) r = 31;
	int g = ((dst >> 5) & 0x3F) + sg; if (g > 63) g = 63;
	int b = (dst & 0x1F) + sb; if (b > 31) b = 31;
	return (WORD)((r << 11) | (g << 5) | b);
}

static inline WORD AddPixel555(WORD src, WORD dst, DWORD alpha) {
	int sr = (((src >> 10) & 0x1F) * (int)alpha) >> 4;
	int sg = (((src >> 5) & 0x1F) * (int)alpha) >> 4;
	int sb = ((src & 0x1F) * (int)alpha) >> 4;
	int r = ((dst >> 10) & 0x1F) + sr; if (r > 31) r = 31;
	int g = ((dst >> 5) & 0x1F) + sg; if (g > 31) g = 31;
	int b = (dst & 0x1F) + sb; if (b > 31) b = 31;
	return (WORD)((r << 10) | (g << 5) | b);
}

static inline WORD SubPixel565(WORD src, WORD dst, DWORD alpha) {
	int dr = (((dst >> 11) & 0x1F) * (int)alpha) >> 4;
	int dg = (((dst >> 5) & 0x3F) * (int)alpha) >> 4;
	int db = ((dst & 0x1F) * (int)alpha) >> 4;
	int r = dr - ((src >> 11) & 0x1F); if (r < 0) r = 0;
	int g = dg - ((src >> 5) & 0x3F); if (g < 0) g = 0;
	int b = db - (src & 0x1F); if (b < 0) b = 0;
	return (WORD)((r << 11) | (g << 5) | b);
}

static inline WORD SubPixel555(WORD src, WORD dst, DWORD alpha) {
	int dr = (((dst >> 10) & 0x1F) * (int)alpha) >> 4;
	int dg = (((dst >> 5) & 0x1F) * (int)alpha) >> 4;
	int db = ((dst & 0x1F) * (int)alpha) >> 4;
	int r = dr - ((src >> 10) & 0x1F); if (r < 0) r = 0;
	int g = dg - ((src >> 5) & 0x1F); if (g < 0) g = 0;
	int b = db - (src & 0x1F); if (b < 0) b = 0;
	return (WORD)((r << 10) | (g << 5) | b);
}

static inline WORD BlendRGBPixel565(WORD src, DWORD RGB) {
	DWORD eax = ((DWORD)(src & 0x1F)) | (((DWORD)((src >> 5) & 0x3F)) << 10) | (((DWORD)((src >> 11) & 0x1F)) << 21);
	eax = (eax + RGB) >> 1;
	return (WORD)(((eax & 0x1F)) | (((eax >> 10) & 0x3F) << 5) | (((eax >> 21) & 0x1F) << 11));
}

static inline WORD BlendRGBPixel555(WORD src, DWORD RGB) {
	DWORD eax = ((DWORD)(src & 0x1F)) | (((DWORD)((src >> 5) & 0x1F)) << 11) | (((DWORD)((src >> 10) & 0x1F)) << 21);
	eax = (eax + RGB) >> 1;
	return (WORD)(((eax & 0x1F)) | (((eax >> 11) & 0x1F) << 5) | (((eax >> 21) & 0x1F) << 10));
}

static inline WORD CharRGBPixel565(WORD src, DWORD RGB) {
	DWORD d = src & 0x1F;
	DWORD eax = ((RGB * d) >> 5) & 0x03E0FC1F;
	return (WORD)(((eax & 0x1F)) | (((eax >> 10) & 0x3F) << 5) | (((eax >> 21) & 0x1F) << 11));
}

static inline WORD CharRGBPixel555(WORD src, DWORD RGB) {
	DWORD d = src & 0x1F;
	DWORD eax = ((RGB * d) >> 5) & 0x03E0FC1F;
	return (WORD)(((eax & 0x1F)) | (((eax >> 11) & 0x1F) << 5) | (((eax >> 21) & 0x1F) << 10));
}

void PutCmprsImgClipingTrans565(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, WORD MSK) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [MSK](WORD* d, WORD s) { *d = ((*d & MSK) >> 1) + ((s & MSK) >> 1); });
}
void PutCmprsImgNOTClipingTrans565(int x, int y, int yl, LPVOID Stmp, LPVOID dest, WORD MSK) {
	PutCmprsImgClipingTrans565(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, MSK);
}
void PutCmprsImgClipingTrans555(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, WORD MSK) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [MSK](WORD* d, WORD s) { *d = ((*d & MSK) >> 1) + ((s & MSK) >> 1); });
}
void PutCmprsImgNOTClipingTrans555(int x, int y, int yl, LPVOID Stmp, LPVOID dest, WORD MSK) {
	PutCmprsImgClipingTrans555(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, MSK);
}
void PutCompressedImageTrans(int x, int y, Spr *sp, WORD MSK)
{
	int		lx, rx, ty, by , IsC=0;
	
	
	if( sp == NULL ) return;
	if( sp->img == NULL ) return;
	
	
	int xl = sp->xl;
	int yl = sp->yl;
	
	if( xl == 0 ) return;
	if( yl == 0 ) return;
	
	
	x -= sp->ox;
	y -= sp->oy;
	
	
	if( x >= SCREEN_WIDTH  ) return; 
	else if( x + xl < 0 ) return; 
	
	if( y >= SCREEN_HEIGHT ) return; 
	else if( y + yl < 0  ) return;
	
	rx = xl;
	lx = 0;
	ty = 0;
	by = yl;
	
	
	
	if( x + xl >= SCREEN_WIDTH )
	{
		rx -= x + xl - SCREEN_WIDTH;
		IsC = 1;
	}
	if( x < 0 )
	{
		lx  = 0 - x;
		x   = 0;
		rx -= lx;
		IsC = 1;
	}
	
	if( y + yl >= SCREEN_HEIGHT )
	{
		by -= y + yl - SCREEN_HEIGHT;
		IsC = 1;
	}
	if( y < 0 )
	{
		ty  = 0 - y;
		y   = 0;
		by -= ty;
		IsC = 1;
	}	
	
	
	if( _PixelInfo.BitMaskR == 0x7C00)		
	{
		if( IsC )
			PutCmprsImgClipingTrans555( x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, MSK);
		else
			PutCmprsImgNOTClipingTrans555( x, y, yl, sp->img, g_DestBackBuf, MSK);
	}
	else
	{
		if( IsC )
			PutCmprsImgClipingTrans565( x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, MSK);
		else
			PutCmprsImgNOTClipingTrans565( x, y, yl, sp->img, g_DestBackBuf, MSK);
	}
	
	return;
}
/////////////////////////////////////////////////////////////////////////// Put Sprite Transperensy..
//////////////////////////////////////////////////////////////////////////////////////////////////


void PutCmprsImgCliping(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [](WORD* d, WORD s) { *d = s; });
}
void PutCmprsImgNOTCliping(int x, int y, int yl, LPVOID Stmp, LPVOID dest) {
	PutCmprsImgCliping(x, y, Stmp, dest, 0, 0x7FFF, 0, yl);
}
void PutCompressedImage(int x, int y, Spr *sp )
{		
	int		lx, rx, ty, by , IsC=0;
	
	if( sp == NULL ) return;
	if( sp->img == NULL ) return;
	
	int xl = sp->xl;
	int yl = sp->yl;
	
	if( xl == 0 ) return;
	if( yl == 0 ) return;
	
	x -= sp->ox;
	y -= sp->oy;
	
	
	if( x >= SCREEN_WIDTH  ) return; 
	else if( x + xl < 0 ) return; 
	
	if( y >= SCREEN_HEIGHT ) return; 
	else if( y + yl < 0  ) return;
	
	rx = xl;
	lx = 0;
	ty = 0;
	by = yl;
	
	
	
	if( x + xl >= (SCREEN_WIDTH-1) )
	{
		rx -= x + xl - (SCREEN_WIDTH-1);
		IsC = 1;
	}
	if( x < 0 )
	{
		lx  = 0 - x;
		x   = 0;
		rx -= lx;
		IsC = 1;
	}
	
	if( y + yl >= SCREEN_HEIGHT )
	{
		by -= y + yl - SCREEN_HEIGHT;
		IsC = 1;
	}
	if( y < 0 )
	{
		ty  = 0 - y;
		y   = 0;
		by -= ty;
		IsC = 1;
	}	
	
	
	if( sp->img == NULL ) return;
	
	
	if( IsC )
	{	
		PutCmprsImgCliping( x,  y, sp->img, g_DestBackBuf, lx, rx+1, ty, by);
	}	
	else
	{	
		PutCmprsImgNOTCliping( x,  y, sp->yl, sp->img, g_DestBackBuf );
	}	
}		


void PutCmprsImgClipingOneColor(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, WORD color) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [color](WORD* d, WORD s) { (void)s; *d = color; });
}
void PutCmprsImgNOTClipingOneColor(int x, int y, int yl, LPVOID Stmp, LPVOID dest, WORD color) {
	PutCmprsImgClipingOneColor(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, color);
}
void PutCompressedImageOneColor(int x, int y, Spr *sp, WORD color )
{		
	
	int		lx, rx, ty, by , IsC=0;
	
	int		ey = SCREEN_HEIGHT;
	
	if( sp == NULL ) return;
	if( sp->img == NULL ) return;
	
	
	
	int xl = sp->xl;
	int yl = sp->yl;
	
	if( xl == 0 ) return;
	if( yl == 0 ) return;
	
	x -= sp->ox;
	y -= sp->oy;
	
	
	if( x >= SCREEN_WIDTH -1 ) return; 
	else if( x + xl < 1 ) return; 
	
	if( y >= ey ) return; 
	else if( y + yl < 0  ) return;
	
	rx = xl;
	lx = 1;
	ty = 0;
	by = yl;
	
	
	
	if( x + xl >= SCREEN_WIDTH-1)
	{
		rx -= x + xl - (SCREEN_WIDTH-1);
		IsC = 1;
	}
	if( x < 1 )
	{
		lx  = 1 - x;
		x   = 1;
		rx -= lx;
		IsC = 1;
	}
	
	if( y + yl >= SCREEN_HEIGHT )
	{
		by -= y + yl - ey;
		IsC = 1;
	}
	if( y < 0 )
	{
		ty  = 0 - y;
		y   = 0;
		by -= ty;
		IsC = 1;
	}	
	
	
	if( IsC )
	{	
		PutCmprsImgClipingOneColor( x,  y, sp->img, g_DestBackBuf, lx, rx, ty, by, color);
	}	
	else
	{	
		PutCmprsImgNOTClipingOneColor( x,  y, sp->yl, sp->img, g_DestBackBuf, color );
	}	
}		


void PutCmprsImgVoidCliping(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [](WORD* d, WORD s) { (void)s; *(d - 1) = *d; });
}
void PutCmprsImgVoidNOTCliping(int x, int y, int yl, LPVOID Stmp, LPVOID dest) {
	PutCmprsImgVoidCliping(x, y, Stmp, dest, 0, 0x7FFF, 0, yl);
}
void PutCompressedImageVoid(int x, int y, Spr *sp )
{		
	int	lx, rx, ty, by , IsC=0;
	
	if( sp == NULL ) return;
	if( sp->img == NULL ) return;
	
	
	int xl = sp->xl;
	int yl = sp->yl;
	
	if( xl == 0 ) return;
	if( yl == 0 ) return;
	
	x -= sp->ox;
	y -= sp->oy;
	
	if( x >= (SCREEN_WIDTH-2)  )	return; 
	else if( x + xl < 0 )			return; 
	
	if( y >= SCREEN_HEIGHT )		return; 
	else if( y + yl < 0  )			return;
	
	rx = xl;
	lx = 0;
	ty = 0;
	by = yl;
	
	if( x + xl >= (SCREEN_WIDTH-2) )
	{
		rx -= x + xl - (SCREEN_WIDTH-2);
		IsC = 1;
	}
	if( x < 0 )
	{
		lx  = 0 - x;
		x   = 0;
		rx -= lx;
		IsC = 1;
	}
	
	if( y + yl >= SCREEN_HEIGHT )
	{
		by -= y + yl - SCREEN_HEIGHT;
		IsC = 1;
	}
	if( y < 0 )
	{
		ty  = 0 - y;
		y   = 0;
		by -= ty;
		IsC = 1;
	}	
	
	if( IsC )
		PutCmprsImgVoidCliping( x,  y, sp->img, g_DestBackBuf, lx, rx, ty, by);
	else
		PutCmprsImgVoidNOTCliping( x,  y, sp->yl, sp->img, g_DestBackBuf );
}		


void PutCompressImageApart( int x, int y, Spr *sp, int sx, int sy, int ex, int ey, int alpha )
{
	int		lx, rx, ty, by , IsC=0;
	
	int xl = sp->xl;
	int yl = sp->yl;
	
	if( sp == NULL ) return;
	if( sp->img == NULL ) return;
	
	
	if( xl == 0 ) return;
	if( yl == 0 ) return;
	
	//	x -= sp->ox;
	//	y -= sp->oy;
	
	
	if( x >= ex  ) return; 
	else if( x + xl < sx ) return; 
	
	if( y >= ey ) return; 
	else if( y + yl < sy  ) return;
	
	rx = xl;
	lx = sx;
	ty = sy;
	by = yl;
	
	if( x + xl >= ex )
	{
		rx -= x + xl - ex;
	}
	if( x < sx )
	{
		lx  = sx - x;
		x   = sx;
		rx -= lx;
	}
	
	if( y + yl >= ey )
	{
		by -= y + yl - ey;
	}
	if( y < sy )
	{
		ty  = sy - y;
		y   = sy;
		by -= ty;
	}	
	
	if( alpha > 31 )
	{
		PutCmprsImgCliping( x,  y, sp->img, g_DestBackBuf, lx, rx, ty, by);
	}
	else 
	{
		if( _PixelInfo.BitMaskR == 0x7C00)
		{
			PutCmprsImgClipingBlend555(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
		}
		else
		{
			PutCmprsImgClipingBlend565(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
		}
	}
	
}





void PutCompressImageSubApart( int x, int y, Spr *sp, int sx, int sy, int ex, int ey, int alpha )
{
	int		lx, rx, ty, by , IsC=0;
	
	int xl = sp->xl;
	int yl = sp->yl;
	
	if( sp == NULL ) return;
	if( sp->img == NULL ) return;
	
	
	if( xl == 0 ) return;
	if( yl == 0 ) return;
	
	//	x -= sp->ox;
	//	y -= sp->oy;
	
	
	if( x >= ex  ) return; 
	else if( x + xl < sx ) return; 
	
	if( y >= ey ) return; 
	else if( y + yl < sy  ) return;
	
	rx = xl;
	lx = sx;
	ty = sy;
	by = yl;
	
	if( x + xl >= ex )
	{
		rx -= x + xl - ex;
	}
	if( x < sx )
	{
		lx  = sx - x;
		x   = sx;
		rx -= lx;
	}
	
	if( y + yl >= ey )
	{
		by -= y + yl - ey;
	}
	if( y < sy )
	{
		ty  = sy - y;
		y   = sy;
		by -= ty;
	}	
	
	if( alpha > 31 )
	{
		PutCmprsImgCliping( x,  y, sp->img, g_DestBackBuf, lx, rx, ty, by);
	}
	else 
	{
		if( _PixelInfo.BitMaskR == 0x7C00)
		{
			
			PutCmprsImgClipingSub555( x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
			
			//			PutCmprsImgClipingBlend555(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
		}
		else
		{
			PutCmprsImgClipingSub565( x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
			
			//			PutCmprsImgClipingBlend565(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
		}
	}
	
}


void PutCmprsImgClipingHBlend565(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [](WORD* d, WORD s) { *d = ((*d & 0xF7DE) >> 1) + ((s & 0xF7DE) >> 1); });
}
void PutCmprsImgNOTClipingHBlend565(int x, int y, int yl, LPVOID Stmp, LPVOID dest) {
	PutCmprsImgClipingHBlend565(x, y, Stmp, dest, 0, 0x7FFF, 0, yl);
}
void PutCmprsImgClipingHBlend555(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [](WORD* d, WORD s) { *d = ((*d & 0x7BDE) >> 1) + ((s & 0x7BDE) >> 1); });
}
void PutCmprsImgNOTClipingHBlend555(int x, int y, int yl, LPVOID Stmp, LPVOID dest) {
	PutCmprsImgClipingHBlend555(x, y, Stmp, dest, 0, 0x7FFF, 0, yl);
}
void PutCmprsImgClipingBlend565(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD alpha) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [alpha](WORD* d, WORD s) { *d = BlendPixel565(s, *d, alpha); });
}
void PutCmprsImgNOTClipingBlend565(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD alpha) {
	PutCmprsImgClipingBlend565(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, alpha);
}
void PutCmprsImgClipingBlend555(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD alpha) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [alpha](WORD* d, WORD s) { *d = BlendPixel555(s, *d, alpha); });
}
void PutCmprsImgNOTClipingBlend555(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD alpha) {
	PutCmprsImgClipingBlend555(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, alpha);
}
void PutCmprsImgClipingBlendDifer565(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD alpha) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [alpha](WORD* d, WORD s) { if (s != *d) *d = BlendPixel565(s, *d, alpha); });
}
void PutCmprsImgNOTClipingBlendDifer565(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD alpha) {
	PutCmprsImgClipingBlendDifer565(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, alpha);
}
void PutCmprsImgClipingBlendDifer555(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD alpha) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [alpha](WORD* d, WORD s) { if (s != *d) *d = BlendPixel555(s, *d, alpha); });
}
void PutCmprsImgNOTClipingBlendDifer555(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD alpha) {
	PutCmprsImgClipingBlendDifer555(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, alpha);
}
void PutCmprsImgClipingAdd565(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD alpha) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [alpha](WORD* d, WORD s) { *d = AddPixel565(s, *d, alpha); });
}
void PutCmprsImgNOTClipingAdd565(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD alpha) {
	PutCmprsImgClipingAdd565(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, alpha);
}
void PutCmprsImgClipingAdd555(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD alpha) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [alpha](WORD* d, WORD s) { *d = AddPixel555(s, *d, alpha); });
}
void PutCmprsImgNOTClipingAdd555(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD alpha) {
	PutCmprsImgClipingAdd555(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, alpha);
}
void PutCmprsImgClipingSub565(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD alpha) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [alpha](WORD* d, WORD s) { *d = SubPixel565(s, *d, alpha); });
}
void PutCmprsImgNOTClipingSub565(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD alpha) {
	PutCmprsImgClipingSub565(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, alpha);
}
void PutCmprsImgClipingSub555(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD alpha) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [alpha](WORD* d, WORD s) { *d = SubPixel555(s, *d, alpha); });
}
void PutCmprsImgNOTClipingSub555(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD alpha) {
	PutCmprsImgClipingSub555(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, alpha);
}
void PutCmprsImgClipingAddDifer565(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD alpha) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [alpha](WORD* d, WORD s) { if (s != *d) *d = AddPixel565(s, *d, alpha); });
}
void PutCmprsImgNOTClipingAddDifer565(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD alpha) {
	PutCmprsImgClipingAddDifer565(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, alpha);
}
void PutCmprsImgClipingAddDifer555(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD alpha) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [alpha](WORD* d, WORD s) { if (s != *d) *d = AddPixel555(s, *d, alpha); });
}
void PutCmprsImgNOTClipingAddDifer555(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD alpha) {
	PutCmprsImgClipingAddDifer555(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, alpha);
}
void PutCompressedImageFX(int x, int y, Spr *sp, DWORD alpha, DWORD op)
{
	int		lx, rx, ty, by , IsC=0;
	
	if( sp == NULL ) return;
	if( sp->img == NULL ) return;
	
	
	int xl = sp->xl;
	int yl = sp->yl;
	
	if( xl == 0 ) return;
	if( yl == 0 ) return;
	
	x -= sp->ox;
	y -= sp->oy;
	
	
	if( x >= SCREEN_WIDTH  ) return; 
	else if( x + xl < 0 ) return; 
	
	if( y >= SCREEN_HEIGHT ) return; 
	else if( y + yl < 0  ) return;
	
	rx = xl;
	lx = 0;
	ty = 0;
	by = yl;
	
	
	
	
	if( x + xl >= SCREEN_WIDTH )
	{
		rx -= x + xl - SCREEN_WIDTH;
		IsC = 1;
	}
	if( x < 0 )
	{
		lx  = 0 - x;
		x   = 0;
		rx -= lx;
		IsC = 1;
	}
	
	if( y + yl >= SCREEN_HEIGHT )
	{
		by -= y + yl - SCREEN_HEIGHT;
		IsC = 1;
	}
	if( y < 0 )
	{
		ty  = 0 - y;
		y   = 0;
		by -= ty;
		IsC = 1;
	}
	
	
	//-----------------------
	if( _PixelInfo.BitMaskR == 0x7C00)
	{
		if(IsC){
			switch(op){
			case 1://alpha
				PutCmprsImgClipingBlend555(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
				break;
			case 2://add
				PutCmprsImgClipingAdd555(x, y,  sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
				break;
			case 3://sub
				PutCmprsImgClipingSub555(x, y,  sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
				break;
			case 4://H alpha
				PutCmprsImgClipingHBlend555(x, y,  sp->img, g_DestBackBuf, lx, rx, ty, by);
				break;
			case 5:// Add not put the same colors between dest and source
				PutCmprsImgClipingAddDifer555(x, y,  sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
				break;
			case 6://alpha not put the same colors between dest and source
				PutCmprsImgClipingBlendDifer555(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
				break;
			}
		}
		else
			switch(op){ 
			case 1://alpha
				PutCmprsImgNOTClipingBlend555(x, y, yl,  sp->img, g_DestBackBuf, alpha);
				break;
			case 2://add
				PutCmprsImgNOTClipingAdd555(x, y, yl,  sp->img, g_DestBackBuf, alpha);
				break;
			case 3://sub
				PutCmprsImgNOTClipingSub555(x, y, yl,  sp->img, g_DestBackBuf, alpha);
				break;
			case 4://H alpha
				PutCmprsImgNOTClipingHBlend555(x, y, yl,  sp->img, g_DestBackBuf);
				break;
			case 5://add not put the same colors between dest and source
				PutCmprsImgNOTClipingAddDifer555(x, y, yl,  sp->img, g_DestBackBuf, alpha);
				break;
			case 6://alpha not put the same colors between dest and source
				PutCmprsImgNOTClipingBlendDifer555(x, y, yl,  sp->img, g_DestBackBuf, alpha);
				break;
		}
	}
	else
	{
		if(IsC){
			switch(op){
			case 1://alpha
				PutCmprsImgClipingBlend565(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
				break;
			case 2://add
				if( sp->yl == 464 )
				{
					;
					
				}
				
				PutCmprsImgClipingAdd565(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
				//PutCmprsImgClipingOneColor(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
				//PutCmprsImgClipingBlend565
				//PutCmprsImgClipingSub565
				
				//PutCmprsImgClipingHBlend565(x, y,  sp->img, g_DestBackBuf, lx, rx, ty, by);
				break;
			case 3://sub
				PutCmprsImgClipingSub565(x, y,  sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
				break;
			case 4://H alpha
				PutCmprsImgClipingHBlend565(x, y,  sp->img, g_DestBackBuf, lx, rx, ty, by);
				break;
			case 5://add not put the same colors between dest and source
				PutCmprsImgClipingAddDifer565(x, y,  sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
				break;
			case 6://alpha not put the same colors between dest and source
				PutCmprsImgClipingBlendDifer565(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, alpha);
				break;
			}
		}
		else
			switch(op){ 
			case 1://alpha
				PutCmprsImgNOTClipingBlend565(x, y, yl,  sp->img, g_DestBackBuf, alpha);
				break;
			case 2://add
				PutCmprsImgNOTClipingAdd565(x, y, yl,  sp->img, g_DestBackBuf, alpha);
				break;
			case 3://sub
				PutCmprsImgNOTClipingSub565(x, y, yl,  sp->img, g_DestBackBuf, alpha);
				break;
			case 4://H alpha
				PutCmprsImgNOTClipingHBlend565(x, y, yl,  sp->img, g_DestBackBuf);
				break;
			case 5://add  not put the same colors between dest and source
				PutCmprsImgNOTClipingAddDifer565(x, y, yl,  sp->img, g_DestBackBuf, alpha);
				break;
			case 6://alpha not put the same colors between dest and source
				PutCmprsImgNOTClipingBlendDifer565(x, y, yl,  sp->img, g_DestBackBuf, alpha);
				break;
		}
	}
	
}		


void PutCmprsImgNOTClipingShadow565(int x, int y, int yl, LPVOID Stmp, LPVOID dest) {
	if (Stmp == NULL || dest == NULL || yl <= 0) return;
	x += (yl / 2);
	y += (yl / 2);
	char* edx = (char*)dest + y * dDxSize + (x * 2);
	const unsigned char* esi = (const unsigned char*)Stmp;
	int j = yl;
	int sk = dDxSize - 2;
	while (j > 0) {
		char* edi = edx;
		while (*(const WORD*)esi != 0xFFFF) {
			edi += *(const WORD*)esi;
			int cnt = (*(const WORD*)(esi + 2)) >> 1;
			esi += 4;
			for (int i = 0; i < cnt; i++) {
				*(WORD*)edi = ((*(WORD*)edi) & 0xF7DE) >> 1;
				esi += 2;
				edi += 2;
			}
		}
		esi += 2;
		edx += sk;
		j--;
		if (j <= 0) break;
		while (*(const WORD*)esi != 0xFFFF) {
			int bytes = *(const WORD*)(esi + 2);
			esi += 4 + bytes;
		}
		esi += 2;
		j--;
	}
}
void PutCmprsImgNOTClipingShadow555(int x, int y, int yl, LPVOID Stmp, LPVOID dest) {
	if (Stmp == NULL || dest == NULL || yl <= 0) return;
	x += (yl / 2);
	y += (yl / 2);
	char* edx = (char*)dest + y * dDxSize + (x * 2);
	const unsigned char* esi = (const unsigned char*)Stmp;
	int j = yl;
	int sk = dDxSize - 2;
	while (j > 0) {
		char* edi = edx;
		while (*(const WORD*)esi != 0xFFFF) {
			edi += *(const WORD*)esi;
			int cnt = (*(const WORD*)(esi + 2)) >> 1;
			esi += 4;
			for (int i = 0; i < cnt; i++) {
				*(WORD*)edi = ((*(WORD*)edi) & 0x7BDE) >> 1;
				esi += 2;
				edi += 2;
			}
		}
		esi += 2;
		edx += sk;
		j--;
		if (j <= 0) break;
		while (*(const WORD*)esi != 0xFFFF) {
			int bytes = *(const WORD*)(esi + 2);
			esi += 4 + bytes;
		}
		esi += 2;
		j--;
	}
}
void PutCompressedImageShadow( int x, int y, Spr *sp )
{	
	int	lx, rx, ty, by , IsC=0;
	int xl = sp->xl;
	int yl = sp->yl;
	
	if( sp == NULL ) return;
	if( sp->img == NULL ) return;
	
	x -= sp->ox;
	y -= sp->oy;
	
	if( x >= SCREEN_WIDTH  )			return; 
	else if( x + xl < 0 )	return; 
	if( y >= GAME_SCREEN_YSIZE )			return; 
	else if( y + yl < 0  )	return;
	
	rx = xl;
	lx = 0;
	ty = 0;
	by = yl;
	
	if( x + xl >= SCREEN_WIDTH )
	{
		rx -= x + xl - SCREEN_WIDTH;
		IsC = 1;
	}
	if( x < 0 )
	{
		lx  = 0 - x;
		x   = 0;
		rx -= lx;
		IsC = 1;
	}
	if( y + yl >= GAME_SCREEN_YSIZE )
	{
		by -= y + yl - GAME_SCREEN_YSIZE;
		IsC = 1;
	}
	if( y < 0 )
	{
		ty  = 0 - y;
		y   = 0;
		by -= ty;
		IsC = 1;
	}
	
	if( _PixelInfo.BitMaskR == 0x7C00)
	{
		if(IsC){
		}
		else 
		{
			PutCmprsImgNOTClipingShadow555( x, y, yl, sp->img, g_DestBackBuf);
		}
	}
	else
	{
		if(IsC){
		}
		else 
		{
			PutCmprsImgNOTClipingShadow565( x, y, yl, sp->img, g_DestBackBuf);
		}
	}
}	


void PutCmprsImgNOTClipingLight(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD alpha) {
	RunCmprsClipped(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, [alpha](WORD* d, WORD s) {
		int sr = (((s >> 11) & 0x1F) * (int)alpha) >> 4; if (sr > 31) sr = 31;
		int sg = (((s >> 5) & 0x3F) * (int)alpha) >> 4; if (sg > 63) sg = 63;
		int sb = ((s & 0x1F) * (int)alpha) >> 4; if (sb > 31) sb = 31;
		*d = (WORD)((sr << 11) | (sg << 5) | sb);
	});
}
void PutCmprsImgClipingBlendRGB565(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD RGB) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [RGB](WORD* d, WORD s) { *d = BlendRGBPixel565(s, RGB); });
}
void PutCmprsImgNOTClipingBlendRGB565(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD RGB) {
	PutCmprsImgClipingBlendRGB565(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, RGB);
}
void PutCmprsImgClipingBlendRGB555(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD RGB) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [RGB](WORD* d, WORD s) { *d = BlendRGBPixel555(s, RGB); });
}
void PutCmprsImgNOTClipingBlendRGB555(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD RGB) {
	PutCmprsImgClipingBlendRGB555(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, RGB);
}
void PutCompressedImageBlendRGB( int x, int y, Spr *sp, DWORD RGB )
{
	int	lx, rx, ty, by , IsC=0;
	
	if( sp == NULL ) return;
	if( sp->img == NULL ) return;
	
	
	int xl = sp->xl;
	int yl = sp->yl;
	
	
	x -= sp->ox;
	y -= sp->oy;
	
	if( x >= SCREEN_WIDTH  )			return; 
	else if( x + xl < 0 )	return; 
	if( y >= SCREEN_HEIGHT )			return; 
	else if( y + yl < 0  )	return;
	
	rx = xl;
	lx = 0;
	ty = 0;
	by = yl;
	
	if( x + xl >= SCREEN_WIDTH )
	{
		rx -= x + xl - SCREEN_WIDTH;
		IsC = 1;
	}
	if( x < 0 )
	{
		lx  = 0 - x;
		x   = 0;
		rx -= lx;
		IsC = 1;
	}
	if( y + yl >= SCREEN_HEIGHT )
	{
		by -= y + yl - SCREEN_HEIGHT;
		IsC = 1;
	}	
	if(	y < 0 )
	{	
		ty  = 0 - y;
		y   = 0;
		by -= ty;
		IsC = 1;
	}		
	
	if( _PixelInfo.BitMaskR == 0x7C00)
	{
		if(IsC)	PutCmprsImgClipingBlendRGB555(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, RGB );
		else 	PutCmprsImgNOTClipingBlendRGB555( x, y, yl, sp->img, g_DestBackBuf, RGB);
	}
	else
	{
		if(IsC)	PutCmprsImgClipingBlendRGB565(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, RGB );
		else 	PutCmprsImgNOTClipingBlendRGB565( x, y, yl, sp->img, g_DestBackBuf, RGB);
	}
}		


void PutCmprsImgClipingCharRGB565(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD RGB) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [RGB](WORD* d, WORD s) { *d = CharRGBPixel565(s, RGB); });
}
void PutCmprsImgNOTClipingCharRGB565(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD RGB) {
	PutCmprsImgClipingCharRGB565(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, RGB);
}
void PutCmprsImgClipingCharRGB555(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD RGB) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [RGB](WORD* d, WORD s) { *d = CharRGBPixel555(s, RGB); });
}
void PutCmprsImgNOTClipingCharRGB555(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD RGB) {
	PutCmprsImgClipingCharRGB555(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, RGB);
}
void PutCompressedImageCharRGB( int x, int y, Spr *sp, DWORD RGB )
{
	int	lx, rx, ty, by , IsC=0;
	
	if( sp == NULL ) return;
	if( sp->img == NULL ) return;
	
	int xl = sp->xl;
	int yl = sp->yl;
	
	x -= sp->ox;
	y -= sp->oy;
	
	if( x >= SCREEN_WIDTH  )			return; 
	else if( x + xl < 0 )	return; 
	if( y >= SCREEN_HEIGHT )			return; 
	else if( y + yl < 0  )	return;
	
	rx = xl;
	lx = 0;
	ty = 0;
	by = yl;
	
	if( x + xl >= SCREEN_WIDTH )
	{
		rx -= x + xl - SCREEN_WIDTH;
		IsC = 1;
	}
	if( x < 0 )
	{	
		lx  = 0 - x;
		x   = 0;
		rx -= lx;
		IsC = 1;
	}	
	if( y + yl >= SCREEN_HEIGHT )
	{	
		by -= y + yl - SCREEN_HEIGHT;
		IsC = 1;
	}	
	if(	y < 0 )
	{	
		ty  = 0 - y;
		y   = 0;
		by -= ty;
		IsC = 1;
	}		
	
	if( _PixelInfo.BitMaskR == 0x7C00)
	{
		if(IsC)		PutCmprsImgClipingCharRGB555(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, RGB );
		else 		PutCmprsImgNOTClipingCharRGB555( x, y, yl, sp->img, g_DestBackBuf, RGB);
	}
	else
	{
		if(IsC)		PutCmprsImgClipingCharRGB565(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, RGB );
		else 		PutCmprsImgNOTClipingCharRGB565( x, y, yl, sp->img, g_DestBackBuf, RGB);
	}
}		
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

void PutCmprsImgClipingCharRGBDifer565(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD RGB) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [RGB](WORD* d, WORD s) { WORD p = CharRGBPixel565(s, RGB); if (p != *d) *d = p; });
}
void PutCmprsImgNOTClipingCharRGBDifer565(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD RGB) {
	PutCmprsImgClipingCharRGBDifer565(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, RGB);
}
void PutCmprsImgClipingCharRGBDifer555(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by, DWORD RGB) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [RGB](WORD* d, WORD s) { WORD p = CharRGBPixel555(s, RGB); if (p != *d) *d = p; });
}
void PutCmprsImgNOTClipingCharRGBDifer555(int x, int y, int yl, LPVOID Stmp, LPVOID dest, DWORD RGB) {
	PutCmprsImgClipingCharRGBDifer555(x, y, Stmp, dest, 0, 0x7FFF, 0, yl, RGB);
}
void PutCompressedImageCharRGBDifer( int x, int y, Spr *sp, DWORD RGB )
{
	int	lx, rx, ty, by , IsC=0;
	
	if( sp == NULL ) return;
	if( sp->img == NULL ) return;
	
	
	int xl = sp->xl;
	int yl = sp->yl;
	
	x -= sp->ox;
	y -= sp->oy;
	
	if( x >= SCREEN_WIDTH  )			return; 
	else if( x + xl < 0 )	return; 
	if( y >= SCREEN_HEIGHT )			return; 
	else if( y + yl < 0  )	return;
	
	rx = xl;
	lx = 0;
	ty = 0;
	by = yl;
	
	if( x + xl >= SCREEN_WIDTH )
	{
		rx -= x + xl - SCREEN_WIDTH;
		IsC = 1;
	}
	if( x < 0 )
	{	
		lx  = 0 - x;
		x   = 0;
		rx -= lx;
		IsC = 1;
	}	
	if( y + yl >= SCREEN_HEIGHT )
	{	
		by -= y + yl - SCREEN_HEIGHT;
		IsC = 1;
	}	
	if(	y < 0 )
	{	
		ty  = 0 - y;
		y   = 0;
		by -= ty;
		IsC = 1;
	}		
	
	if( _PixelInfo.BitMaskR == 0x7C00)
	{
		if(IsC)		PutCmprsImgClipingCharRGBDifer555(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, RGB );
		else 		PutCmprsImgNOTClipingCharRGBDifer555( x, y, yl, sp->img, g_DestBackBuf, RGB);
	}
	else
	{
		if(IsC)		PutCmprsImgClipingCharRGBDifer565(x, y, sp->img, g_DestBackBuf, lx, rx, ty, by, RGB );
		else 		PutCmprsImgNOTClipingCharRGBDifer565( x, y, yl, sp->img, g_DestBackBuf, RGB);
	}
}		
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@



//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

int tilewavetable[ 400] = { 2, 2, 2, 2, 4, 4, 4, 4, 6, 6, 6, 6, 8, 8, 8, 8, 8,10,10,10,
10,10, 8, 8, 8, 8, 8, 6, 6, 6, 6, 6, 4, 4, 4, 4, 2, 2, 2, 2, 
2, 2, 2, 4, 4, 4, 4, 6, 6, 6, 6, 8, 8, 8, 8, 8,10,10,10,10,
10, 8, 8, 8, 8, 8, 6, 6, 6, 6, 6, 4, 4, 4, 4, 2, 2, 2,
2,2,2,2,4,4,4,4,6,6,6,6,8,8,8,8,8,10,10,10,10,10,8,8,8,8,8,6,6,6,6,6,4,4,4,4,2,2,2,
2,2,2,2,4,4,4,4,6,6,6,6,8,8,8,8,8,10,10,10,10,10,8,8,8,8,8,6,6,6,6,6,4,4,4,4,2,2,2,
2,2,2,2,4,4,4,4,6,6,6,6,8,8,8,8,8,10,10,10,10,10,8,8,8,8,8,6,6,6,6,6,4,4,4,4,2,2,2,
2,2,2,2,4,4,4,4,6,6,6,6,8,8,8,8,8,10,10,10,10,10,8,8,8,8,8,6,6,6,6,6,4,4,4,4,2,2,2,
};


void PutCmprsImgClipingWaveTile(int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by) {
	RunCmprsClipped(x, y, Stmp, dest, lx, rx, ty, by, [](WORD* d, WORD s) { *d = s; }, 1);
}
void PutCmprsImgNOTClipingWaveTile(int x, int y, int yl, LPVOID Stmp, LPVOID dest) {
	PutCmprsImgClipingWaveTile(x, y, Stmp, dest, 0, 0x7FFF, 0, yl);
}

void PutCompressedImageWaveTile(int x, int y, Spr *sp )
{		
	
	int		lx, rx, ty, by , IsC=0;
	
	if( sp == NULL ) return;
	if( sp->img == NULL ) return;
	
	
	int xl = sp->xl;
	int yl = sp->yl;
	
	if( xl == 0 ) return;
	if( yl == 0 ) return;
	
	x -= sp->ox;
	y -= sp->oy;
	
	
	if( x >= GAME_SCREEN_XSIZE  ) return; 
	else if( x + xl < 0 ) return; 
	
	if( y >= GAME_SCREEN_YSIZE ) return; 
	else if( y + yl < 0  ) return;
	
	rx = xl;
	lx = 0;
	ty = 0;
	by = yl;
	
	
	
	if( x + xl >= GAME_SCREEN_XSIZE )
	{
		rx -= x + xl - GAME_SCREEN_XSIZE;
		IsC = 1;
	}
	if( x < 0 )
	{
		lx  = 0 - x;
		x   = 0;
		rx -= lx;
		IsC = 1;
	}
	
	if( y + yl >= GAME_SCREEN_YSIZE )
	{
		by -= y + yl - GAME_SCREEN_YSIZE;
		IsC = 1;
	}
	if( y < 0 )
	{
		ty  = 0 - y;
		y   = 0;
		by -= ty;
		IsC = 1;
	}	
	
	
	if( IsC )
	{	
		PutCmprsImgClipingWaveTile( x,  y, sp->img, g_DestBackBuf, lx, rx+1, ty, by);
	}	
	else
	{	
		PutCmprsImgNOTClipingWaveTile( x,  y, sp->yl, sp->img, g_DestBackBuf );
	}	
}		


























//#####################################################################################
//#####################################################################################
//#####################################################################################

//  Character Sprite  Loading....

//#####################################################################################
//#####################################################################################
//#####################################################################################



int LoadCharSpriteData_Sub( char *filename, char **buf, DWORD *length, CharacterSprite *charactersprite, int mode )
{				
	FILE *fp;
	short no;
	DWORD sprfilelength, size;
	DWORD nOff = 0;
	int   i,j;
	Spr  *s;
	
	fp = Fopen( filename, "rb" );
	if( fp == NULL ) return 0;
	
	fread( &no, 2,1, fp);
	fseek( fp, no * 4, SEEK_CUR );  // 오프셋 스킵
	*length = sprfilelength = _filelength( _fileno( fp) ) - no * 4 * 2 - 2;

	if( *buf != NULL )  return 0;
	MemFree( *buf );		// 0201 YGI
	MemAlloc( *buf, sprfilelength );
	
	if( mode == LD_CHAR_SPRITE_ONLY_MEM_ALLOC )
	{				
		fclose(fp );
		return 0;
	}			
				
	//	return 0;//	
	for( i = 0 ; i < 8 ; i ++)
	{			
		for( j = 0 ; j < no/8 ; j ++)
		{				
			s = &charactersprite->sp[i][j];
			if( fread( &size, 4,1, fp) != 1 ) break;
			if( size== 0 )	
			{				
				s->xl = 0;	
				s->yl = 0;	
				s->size = 0;
				s->img = NULL;
				continue;	
			}				
			
			fread( &(s->xl),	sizeof( short ), 1, fp);
			fread( &(s->yl),	sizeof( short ), 1, fp);
			//s->yl ++;		
			fread( &(s->ox),	sizeof( short ), 1, fp);
			fread( &(s->oy),	sizeof( short ), 1, fp);
			fread( &(s->size),sizeof( unsigned int ), 1, fp);
			
			if( nOff + s->size > sprfilelength ) 
			{						
				break;
			}						
			fread( *buf + nOff, s->size, 1, fp);
			s->img = *buf + nOff;
			
			convert565to555_LoadSprite( s );
			
			nOff += size;		
		}
	}
				
	fclose(fp);	
	return sprfilelength;	
}			





int LoadCharSpriteData( char *filename, char **buf, DWORD *length, CharacterSprite *charactersprite, int mode )
{
	int ret;
	if( StartLoadCharSpriteDataThreadFlag )
	{
		ret = 0;
		InputThreadCharSprite( filename, buf, length, charactersprite, mode );
	}
	else
	{
		ret = LoadCharSpriteData_Sub( filename, buf, length, charactersprite, mode );
	}
	return ret ;
}




void FreeCharacterSpriteData( char *buf )
{				
	if( buf == NULL ) return;
	MemFree( buf );
}			

void FreeCharacterSpriteDataAll( int s, int e )
{	
	for (int i = s; i < e; i++)
	{	
		MemFree(CharBuf[i]);
		CharBufCount[i] = 0;
		
		for (int j = 0; j < MAX_CHARACTOR_PART_; j++)
		{
			for (int k = 0; k < MAX_CHARACTER_LAYER_; k++)
			{
				MemFree(CharLayerBuf[i][j][k]);
				CharLayerBufCount[i][j][k] = 0;
			}
		}
	}	
} 

void LoadHeroClothAccessoryData( int s, int e )
{		
	int i;
	char tempfilename[ FILENAME_MAX];
	
	for( i = s ; i <= e ; i ++)
	{	
		sprintf( tempfilename, "./char/000%03d.spr", i );
		LoadCharSpriteData( tempfilename,  &CharAccessoryBuf[ 0][i], &CharAccessoryBufLength[ 0][i], &CharAccessorySpr[ 0][i], LD_CHAR_SPRITE_ALL_LOAD );
		sprintf( tempfilename, "./char/001%03d.spr", i );
		LoadCharSpriteData( tempfilename,  &CharAccessoryBuf[ 1][i], &CharAccessoryBufLength[ 1][i], &CharAccessorySpr[ 1][i], LD_CHAR_SPRITE_ALL_LOAD );
	}	
}		
void FreeHeroClothAccessoryDataOne( int sprno, int no )
{		
	if( no == 0 ) return;
	if( sprno > 1 ) return;
	if( CharAccessoryCount[sprno][ no] <= 0 ) return;
	
	CharAccessoryCount[sprno][ no] --;
	if( CharAccessoryCount[sprno][ no] <= 0 ) 
	{	
		if( CharAccessoryBuf[ sprno][no] == NULL ) return;
		GlobalFree( CharAccessoryBuf[ sprno][no] );
		CharAccessoryBuf[ sprno][no] = NULL;
	}	
}		
void LoadHeroClothAccessoryDataOne( int sprno, int no )
{		
	if( no == 0 ) return;
	if( sprno > 1 ) return;
	if( no >= CHARACTER_ACCESSORY_MAX_ ) return;	// 011018 KHS 망또	
	if( CharAccessoryBuf[ sprno][no] ) return;
	
	char tempfilename[ FILENAME_MAX];
	sprintf( tempfilename, "./char/%03d%03d.spr", sprno, no );
	
	int ret;
	
	ret = LoadCharSpriteData( tempfilename,  &CharAccessoryBuf[ sprno][no], &CharAccessoryBufLength[ sprno][no], &CharAccessorySpr[ sprno][no], LD_CHAR_SPRITE_ALL_LOAD );
}		
void FreeHeroClothAccessoryData( void )
{		
	int i;
	for( i = 1 ; i < 104 ; i ++)
	{	
		FreeCharacterSpriteData( CharAccessoryBuf[ 0][i] );
		CharAccessoryBuf[ 0][i] = NULL;
		CharAccessoryCount[0][i] = 0;
		FreeCharacterSpriteData( CharAccessoryBuf[ 1][i] );
		CharAccessoryBuf[ 1][i] = NULL;
		CharAccessoryCount[1][i] = 0;
	}	
}		

void FreeHeroClothAccessoryDataOne_tool( int sprno, int no )
{	//< CSD-030306	
	if( no == 0 ) return;
	if( sprno > 1 ) return;
	if( CharAccessoryCount[sprno][ no] <= 0 ) return;
		
	CharAccessoryCount[sprno][ no] --;
	if( CharAccessoryCount[sprno][ no] <= 0 ) 
	{	
		if( CharAccessoryBuf[ sprno][no] == NULL ) return;
		GlobalFree( CharAccessoryBuf[ sprno][no] );
		CharAccessoryBuf[ sprno][no] = NULL;
	}	
}	//> CSD-030306		

void LoadHeroClothAccessoryDataOne_tool( int sprno, int no )
{	//< CSD-030306	
	if( no == 0 ) return;
	if( sprno > 1 ) return;
	if( no >= CHARACTER_ACCESSORY_MAX_ ) return;	// 011018 KHS 망또	
	if( CharAccessoryBuf[ sprno][no] ) return;
		
	char tempfilename[ FILENAME_MAX];
	sprintf( tempfilename, "./char_test/%03d%03d.spr", sprno, no );

	int ret;

	ret = LoadCharSpriteData( tempfilename,  &CharAccessoryBuf[ sprno][no], &CharAccessoryBufLength[ sprno][no], &CharAccessorySpr[ sprno][no], LD_CHAR_SPRITE_ALL_LOAD );
}	//> CSD-030306

void LoadHeroSpriteData( void )
{			
	LoadCharSpriteData( "./char/000000.spr",  &CharBuf[0], &CharBufLength[0], &CharSpr[0], LD_CHAR_SPRITE_ALL_LOAD );
	LoadCharSpriteData( "./char/001000.spr",  &CharBuf[1], &CharBufLength[1], &CharSpr[1], LD_CHAR_SPRITE_ALL_LOAD );
	LoadHeroClothAccessoryData( 104, 107 );
	LoadHeroClothAccessoryData( 96, 97 );
}	
void FreeHeroSpriteData( void )
{		
	FreeCharacterSpriteData( CharBuf[0] );
	FreeCharacterSpriteData( CharBuf[1] );
}	









//--------------------------------- 날씨 Animation...............................
//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------


#define MAX_RAIN 		900
#define MAX_RAINFRAME	1 

#define RAIN_SPRITE_		880

static int	rainsx[ MAX_RAIN], 
rainsy[ MAX_RAIN],
rainey[ MAX_RAIN],
//			rainframe[ MAX_RAIN],
//			rainfd[ MAX_RAIN],
rainspr[ MAX_RAIN],
raindownspeed[ MAX_RAIN],
raintrans[  MAX_RAIN],
raindrop[  MAX_RAIN],
rainmax;

static int  RainNumber;

void RainStart( int number, int flag )
{	
	RainNumber = number;
	/////////////////////  SoundUp lkh 추가 /////////////////////////
	int sound_Volume = number/9;
}	

void RainStop( void )
{
	RainNumber = 0;
	////////////////////// SoundUp lkh 추가 /////////////////////////
	StopWave(SOUND_RAINY);
}

void RainAnimationSub( int i )
{
	int tt = 3;
	if		( rainey[i] < 200 )	{ raindownspeed[i] = 15 + Random( 5 );	rainspr[i] = Random( 3 ) + 6;	raintrans[i] = tt+ Random(3); }
	else if	( rainey[i] < 500 )	
	{
		switch( Random(3) )
		{
		case 0 :			{ raindownspeed[i] = 20 + Random( 4 );  rainspr[i] = Random( 3 ) + 4;	raintrans[i] = tt+ Random(3);}
			break;
		case 1 :			{ raindownspeed[i] = 22 + Random( 4 );  rainspr[i] = Random( 3 ) + 6;	raintrans[i] = tt+ Random(4);}
			break;
		default :			{ raindownspeed[i] = 27 + Random( 4 );  rainspr[i] = Random( 3 ) + 5;	raintrans[i] = tt+ Random(4);}
			break;
		}
	}	
	else						{ raindownspeed[i] = 30 + Random( 4 );  rainspr[i] = Random( 2 ) + 2;	raintrans[i] = tt+ Random(3);}
}		

void RainAnimationSetting( void )
{		
	static int start;
	int i;
	int dist;
	
	if( RainNumber == 0 && rainmax == 0 ) 
	{				
		return;
	}	
	else if (RainNumber != rainmax ) 
	{	
		if( RainNumber > rainmax )
		{	
			rainmax += 10;
			if( rainmax > 900 ) rainmax =  900;
		}
		else 
		{
			rainmax -= 10;
		}
	}	
	
	int mapstartx = g_Map.x * 32;
	int mapstarty = g_Map.y * 32;
	
	switch( start )	
	{					
	case 0 :	rainmax = 0;
		for( i = 0 ; i < MAX_RAIN ; i ++ )
		{	
			rainsx[i] = Random( SCREEN_WIDTH  + 200) - 100;
			rainsy[i] = Random( SCREEN_HEIGHT) - SCREEN_HEIGHT;
			rainey[i] = Random( 680);
			RainAnimationSub( i );
		}	
		start = 1;
		break;	
	}				
	
	for( i  = 0 ; i < rainmax ; i ++)
	{				
		if( raindrop[i] == 0 )
		{
			rainsx[ i] += Random( 3)+2;
			rainsy[ i] += raindownspeed[i];
		}
		
		dist    = 5;
		
		//		switch( ch->direction  )
		//		{
		//			case DIRECTION_DOWN		: rainsx[i] -= dist;	rainsy[i] -= dist;		break;
		//			case DIRECTION_LEFTDOWN	:            			rainsy[i] -= dist;		break;
		//			case DIRECTION_LEFT		: rainsx[i] += dist;	rainsy[i] -= dist;		break;
		//			case DIRECTION_LEFTUP	: rainsx[i] += dist;			           		break;
		//			case DIRECTION_UP		: rainsx[i] += dist;	rainsy[i] += dist;		break;
		//			case DIRECTION_RIGHTUP	:            			rainsy[i] += dist;		break;
		//			case DIRECTION_RIGHT	: rainsx[i] -= dist;	rainsy[i] += dist;		break;
		//			case DIRECTION_RIGHTDOWN: rainsx[i] -= dist;				       		break;
		//		}
		
		
		if( raindrop[i] == 0 )
		{
			if( rainsy[i]> rainey[i] )
			{
				raindrop[i] = 2;
			}
		}
		else
		{
			raindrop[i]--;
			if( raindrop[i] == 0 )
			{
				rainsx[i]	= Random( SCREEN_WIDTH  + 200 ) - 100;
				rainsy[i]	= Random( 200 ) - SCREEN_HEIGHT;
				rainey[i]	= Random( 680 );
				RainAnimationSub( i );
			}
		}
	}	
}		

void RainAnimationOutput( void )
{		
	int i;
	
	for( i  = 0 ; i < rainmax ; i ++)
	{			
		if( raindrop[i] ) 
		{		
			switch( raindrop[i] )
			{
			case 1 :	PutCompressedImageFX( rainsx[i], rainsy[i], &spr[ 87 ],  raintrans[i], 2 ); break;
			case 2 : 	PutCompressedImageFX( rainsx[i], rainsy[i], &spr[ 86 ],  raintrans[i], 2 ); break;
			}
			//			PutCompressedImageFX( rainsx[i], rainsy[i], &spr[ RAIN_SPRITE_  ], 14,1 );
			//			PutCompressedImage( rainsx[i], rainsy[i], &spr[ RAIN_SPRITE_  ]);
		}	
		else	
		{	
			if( rainspr[i] )
			{
				//PutCompressedImageTrans(int x, int y, Spr *sp, WORD MSK)
				//PutCompressedImageTrans( rainsx[i], rainsy[i], &spr[ RAIN_SPRITE_ + rainspr[i]], 0 );
				PutCompressedImageFX( rainsx[i], rainsy[i], &spr[ RAIN_SPRITE_ + rainspr[i]], raintrans[i], 2 );
			}
			else
			{
				PutCompressedImageFX( rainsx[i], rainsy[i], &spr[ RAIN_SPRITE_ + rainspr[i]] , raintrans[i], 2 );
			}
		}	
	}			
}	



/*

  
	#define MAX_SNOW  		800
	#define MAX_SNOWFRAME	1 
	
	  #define SNOW_SPRITE_		79
	  
		static int	snowsx[ MAX_SNOW], 
		snowsy[ MAX_SNOW],
		snowey[ MAX_SNOW],
		snowframe[ MAX_SNOW],
		snowfd[ MAX_SNOW],
		snowspr[ MAX_SNOW],
		snowdownspeed[ MAX_SNOW],
		snowtrans[  MAX_SNOW],
		snowflag[  MAX_SNOW],
		snowwind[  MAX_SNOW],
		snowmax;
		
		  
			static int  SnowNumber;
			
			  void SnowStart( int number, int flag )
			  {	
			  SnowNumber = number;
			  }	
			  
				void SnowStop( void )
				{	
				SnowNumber = 0;
				}	
				
				  
					void SnowAnimationSub( int my, int i )
					{			
					int tt = 5;
					
					  if		( snowey[i] - my  < 100 )	{ snowdownspeed[i] =  1 + Random( 5 );  snowspr[i] = Random( 2 ) + 5;	snowtrans[i] = tt+ Random(4);}
					  else if	( snowey[i] - my  < 150 )	{ snowdownspeed[i] =  2 + Random( 4 );  snowspr[i] = Random( 2 ) + 5;	snowtrans[i] = tt+ Random(4);}
					  else if	( snowey[i] - my  < 200 )	{ snowdownspeed[i] =  3 + Random( 4 );  snowspr[i] = Random( 2 ) + 5;	snowtrans[i] = tt+ Random(4);}
					  else if	( snowey[i] - my  < 250 )	{ snowdownspeed[i] =  4 + Random( 4 );  snowspr[i] = Random( 2 ) + 4;	snowtrans[i] = tt+ Random(4);}
					  else if	( snowey[i] - my  < 300 )	{ snowdownspeed[i] =  5 + Random( 4 );  snowspr[i] = Random( 2 ) + 4;	snowtrans[i] = tt+ Random(4);}
					  else 	{ snowdownspeed[i] = 6 + Random( 4 );  snowspr[i] = Random(2) + 5 ;				snowtrans[i] = tt+ Random(4);}
					  }			
					  
						void SnowAnimationSetting( void )
						{				
						static int start;
						int i;		
						int dist;	
						int curhero;
						static int snowwindflag;
						
						  ch		ch = ( ch )g_OrderInfo.order[ 0 ].lpvData;
						  
							if( SnowNumber == 0 && snowmax == 0 ) 
							{				
							return;
							}
							else if( SnowNumber >= snowmax )
							{
							snowmax += 10;
							}
							else 
							{
							snowmax -= 10;
							}
							
							  int mapstartx = g_Map.x * 32;
							  int mapstarty = g_Map.y * 32;
							  
								switch( start )	
								{				
								case 0 :	snowmax = 0;
								for( i = 0 ; i < MAX_SNOW ; i ++ )
								{	
								snowsx[i] = mapstartx + Random( SCREEN_WIDTH  + 200) - 100;
								snowsy[i] = mapstarty + Random( 100) - 100;
								snowey[i] = mapstarty + Random( SCREEN_HEIGHT);
								
								  SnowAnimationSub( mapstarty, i );
								  }	
								  start = 1;
								  break;		
								  }				
								  
									if( Random( 100 ) == 50 )
									{			
									snowwindflag = 40;
									}			
									
									  for( i  = 0	; i < snowmax ; i ++)
									  {				
									  if( snowwindflag )
									  {		
									  snowwindflag --;
									  if( snowwindflag == 0 )
									  {	
									  snowwind[i] = Random(30) + 30;
									  }	
									  }		
									  
										if( snowsy[i] < snowey[i] )
										{		
										if( snowwind[i] ) 
										{	
										snowwind[i] --;
										snowsx[i] -= ( Random( 10 ) + 20 );
										}	
										else 
										snowsx[ i] += ( Random( 5) -2 );
										
										  snowsy[ i] += snowdownspeed[i];
										  }		
										  else if( snowflag[i] == 0 )
										  {	
										  snowflag[i] = 1;
										  snowtrans[i] += 2;
										  if( snowtrans[i] > 15 ) snowtrans[i] = 15;
										  }		
										  else 
										  {	
										  snowtrans[i] --;
										  
											if( snowtrans[i] < 0 )
											{
											snowsx[i]	= mapstartx + Random( SCREEN_WIDTH  + 800 ) - 400;
											snowsy[i]	= mapstarty + Random( 200 ) - 200;
											snowey[i]	= mapstarty + Random( 680 );
											snowflag[i] = 0;
											snowwind[i] = 0;
											
											  SnowAnimationSub( mapstarty, i );
											  }
											  }	
											  }		
											  }			
											  
												void SnowAnimationOutput( void )
												{	
												int i;	
												
												  int mapstartx = g_Map.x * 32;
												  int mapstarty = g_Map.y * 32;
												  
													for( i  = 0 ; i < snowmax ; i ++)
													{
													PutCompressedImageFX( snowsx[i] - mapstartx, snowsy[i] - mapstarty, &spr[ SNOW_SPRITE_+ snowspr[i] ], snowtrans[i], 2 );
													}
													}				
													//-----------------------------------------------------------------------
*/

//----------------------------------------------------------------------



#define MAX_SNOW  		800
#define MAX_SNOWFRAME	1 

#define SNOW_SPRITE_		889

static int	snowsx[ MAX_SNOW],		
snowsy[ MAX_SNOW],		
snowey[ MAX_SNOW],		
snowframe[ MAX_SNOW],	
snowfd[ MAX_SNOW],		
snowspr[ MAX_SNOW],		
snowdownspeed[ MAX_SNOW],
snowtrans[  MAX_SNOW],
snowflag[  MAX_SNOW],
snowwind[  MAX_SNOW],
snowmax;


static int  SnowNumber;

void SnowStart( int no, int flag )
{	
	SnowNumber = 0; 
	
	if( strcmp( MapName, "FIREDUN1" ) == 0 ) return;
	if( strcmp( MapName, "ICE-W01" ) == 0 ) return;
	if( strcmp( MapName, "MANDUN" ) == 0 ) return;
	
	SnowNumber = no; 
}				

void SnowStop( void )
{		
	SnowNumber = 0; 
}				


void SnowAnimationSub( int my, int i )
{		
	int tt = 5;
	
	if		( snowey[i] - my  < 100 )	{ snowdownspeed[i] =  1 + Random( 5 );  snowspr[i] = Random( 2 ) + 5;	snowtrans[i] = tt+ Random(4);}
	else if	( snowey[i] - my  < 150 )	{ snowdownspeed[i] =  2 + Random( 4 );  snowspr[i] = Random( 2 ) + 5;	snowtrans[i] = tt+ Random(4);}
	else if	( snowey[i] - my  < 200 )	{ snowdownspeed[i] =  3 + Random( 4 );  snowspr[i] = Random( 2 ) + 5;	snowtrans[i] = tt+ Random(4);}
	else if	( snowey[i] - my  < 250 )	{ snowdownspeed[i] =  4 + Random( 4 );  snowspr[i] = Random( 2 ) + 4;	snowtrans[i] = tt+ Random(4);}
	else if	( snowey[i] - my  < 300 )	{ snowdownspeed[i] =  5 + Random( 4 );  snowspr[i] = Random( 2 ) + 4;	snowtrans[i] = tt+ Random(4);}
	else 	{ snowdownspeed[i] = 6 + Random( 4 );  snowspr[i] = Random(2) + 5 ;				snowtrans[i] = tt+ Random(4);}
}		

void SnowAnimationSetting( void )
{				
	static int start;
	int i;		
	static int windflag;
				
	if( SnowNumber == 0 && snowmax == 0 ) 
	{	
		return;
	}	
	else if ( SnowNumber != snowmax )
	{		
		if( SnowNumber > snowmax )
		{
			snowmax += 10;
			if( snowmax > 900 ) snowmax = 900;
		}
		else 
		{
			snowmax -= 10;
			if( snowmax < 0 ) snowmax = 0;
		}
	}	
	
	int mapstartx = g_Map.x * 32;
	int mapstarty = g_Map.y * 32;
	
	switch( start )	
	{					
	case 0 :	snowmax = 0;
		for( i = 0 ; i < MAX_SNOW ; i ++ )
		{	
			snowsx[i] = mapstartx + Random( SCREEN_WIDTH  + 200) - 100;
			snowsy[i] = mapstarty + Random( 100) - 100;
			snowey[i] = mapstarty + Random( SCREEN_HEIGHT);
			
			SnowAnimationSub( mapstarty, i );
			
		}	
		start = 1;
		break;	
	}			
	
	//	if( SnowFlag ) snowmax ++ ;
	//	if( snowmax > MAX_SNOW ) 
	//	snowmax = MAX_SNOW;
	
	
	if( Random( 100 ) == 50 )
	{	
		windflag = 40;
	}	
	
	for( i  = 0 ; i < snowmax ; i ++)
	{			
		if( windflag )
		{	
			windflag --;
			if( windflag == 0 )
			{
				snowwind[i] = Random(30) + 30;
			}
		}	
		
		if( snowsy[i] < snowey[i] )
		{	
			if( snowwind[i] ) 
			{
				snowwind[i] --;
				snowsx[i] -= ( Random( 10 ) + 20 );
			}
			else 
				snowsx[ i] += ( Random( 5) -2 );
			
			snowsy[ i] += snowdownspeed[i];
		}	
		else if( snowflag[i] == 0 )
		{	
			snowflag[i] = 1;
			snowtrans[i] += 2;
			if( snowtrans[i] > 15 ) snowtrans[i] = 15;
		}		
		else 
		{	
			snowtrans[i] --;
			
			if( snowtrans[i] < 0 )
			{
				snowsx[i]	= mapstartx + Random( SCREEN_WIDTH  + 800 ) - 400;
				snowsy[i]	= mapstarty + Random( 200 ) - 200;
				snowey[i]	= mapstarty + Random( 680 );
				snowflag[i] = 0;
				snowwind[i] = 0;
				
				SnowAnimationSub( mapstarty, i );
			}
		}	
	}		
}			

void SnowAnimationOutput( void )
{	
	int i;	
	
	int mapstartx = g_Map.x * 32;
	int mapstarty = g_Map.y * 32;
	
	for( i  = 0 ; i < snowmax ; i ++)
	{
		PutCompressedImageFX( snowsx[i] - mapstartx, snowsy[i] - mapstarty, &spr[ SNOW_SPRITE_+ snowspr[i] ], snowtrans[i], 2 );
	}
}			

/*		mov		ax,[esi];
cmp		eax,0;
jz		colorkey;
shl		eax,5;
shr		ax,2;
shr		al,3;

		//ror		eax,11;			//
		//shl		ax,10;			//
		//rol		eax,6;			//
		//shl		ax,5;			
		//rol		eax,5;			
		
		  or		eax,0x00808080;
		  sub		eax,mask;
		  xor		eax,0x00808080;
		  
			movsx	edx,al;
			mov		bx,word ptr[offset SubTableB + 64 + edx*2];	//
			movsx	edx,ah;
			or		bx,word ptr[offset SubTableG + 128 + edx*2];
			shr		eax,16;
			movsx	edx,al;
			or		bx,word ptr[offset SubTableR + 64 + edx*2];	//
*/	



//-------------------------------------------------------------------------	



#define MAX_WIND		300
#define MAX_WINDFRAME	1 

#define WIND_SPRITE_		79

static int	windsx[ MAX_WIND], 
windsy[ MAX_SNOW],
windey[ MAX_WIND],
windframe[ MAX_WIND],
windfd[ MAX_WIND],
windspr[ MAX_WIND],
winddownspeed[ MAX_WIND],
windtrans[  MAX_WIND],
snowwindflag[  MAX_WIND],
windwind[  MAX_WIND],
windflag[  MAX_WIND],
windmax;

static int  WindNumber;

void WindStart( int number )
{	
	WindNumber = number;
}	

void WindStop( void )
{	
	WindNumber = 0;
}	


void WindAnimationSub( int my, int i )
{	
	int tt = 5;
	
	if		( windey[i] - my  < 100 )	{ winddownspeed[i] =  1 + Random( 5 );  windspr[i] = Random( 2 ) + 5;	windtrans[i] = tt+ Random(4);}
	else if	( windey[i] - my  < 150 )	{ winddownspeed[i] =  2 + Random( 4 );  windspr[i] = Random( 2 ) + 5;	windtrans[i] = tt+ Random(4);}
	else if	( windey[i] - my  < 200 )	{ winddownspeed[i] =  3 + Random( 4 );  windspr[i] = Random( 2 ) + 5;	windtrans[i] = tt+ Random(4);}
	else if	( windey[i] - my  < 250 )	{ winddownspeed[i] =  4 + Random( 4 );  windspr[i] = Random( 2 ) + 4;	windtrans[i] = tt+ Random(4);}
	else if	( windey[i] - my  < 300 )	{ winddownspeed[i] =  5 + Random( 4 );  windspr[i] = Random( 2 ) + 4;	windtrans[i] = tt+ Random(4);}
	else 	{ winddownspeed[i] = 6 + Random( 4 );  windspr[i] = Random(2) + 5 ;				windtrans[i] = tt+ Random(4);}
}									

void WindAnimationSetting( void )
{							
	static int start;		
	int i;					
	static int Windflag;	
	
	LPCHARACTER ch = ( LPCHARACTER  )g_OrderInfo.order[ 0 ].lpvData;
	
	if( RainNumber == 0 && rainmax == 0 ) 
	{						
		return;				
	}						
	if( RainNumber >= rainmax )
	{						
		rainmax += 10;		
	}						
	else					
	{						
		rainmax += 10;		
	}						
	
	int mapstartx = g_Map.x * 32;
	int mapstarty = g_Map.y * 32;
	
	switch( start )			
	{						
	case 0 :	windmax = 0;
		for( i = 0 ; i < MAX_WIND ; i ++ )
		{			
			windsx[i] = mapstartx + Random( SCREEN_WIDTH  + 200) - 100;
			windsy[i] = mapstarty + Random( 100) - 100;
			windey[i] = mapstarty + Random( SCREEN_HEIGHT);
			
			WindAnimationSub( mapstarty, i );
			
		}			
		start = 1;	
		break;
	}
	
	//	if( WindFlag ) windmax ++ ;
	//	if( windmax > MAX_WIND ) 
	windmax = MAX_WIND;
	
	
	if( Random( 100 ) == 50 )
	{
		Windflag = 40;
	}
	
	for( i  = 0 ; i < windmax ; i ++)
	{			
		if( Windflag )
		{	
			Windflag --;
			if( Windflag == 0 )
			{
				windwind[i] = Random(30) + 30;
			}
		}	
		
		if( windsy[i] < windey[i] )
		{	
			if( windwind[i] ) 
			{
				windwind[i] --;
				windsx[i] -= ( Random( 10 ) + 20 );
			}
			else 
				windsx[ i] += ( Random( 5) -2 );
			
			windsy[ i] += winddownspeed[i];
		}	
		else if( windflag[i] == 0 )
		{	
			windflag[i] = 1;
			windtrans[i] += 2;
			if( windtrans[i] > 15 ) windtrans[i] = 15;
		}		
		else 
		{	
			windtrans[i] --;
			
			if( windtrans[i] < 0 )
			{
				windsx[i]	= mapstartx + Random( SCREEN_WIDTH  + 800 ) - 400;
				windsy[i]	= mapstarty + Random( 200 ) - 200;
				windey[i]	= mapstarty + Random( 680 );
				windflag[i] = 0;
				windwind[i] = 0;
				
				WindAnimationSub( mapstarty, i );
			}
		}	
	}		
}			

void WindAnimationOutput( void )
{	
	int i;	
	
	int mapstartx = g_Map.x * 32;
	int mapstarty = g_Map.y * 32;
	
	for( i  = 0 ; i < windmax ; i ++)
	{
		PutCompressedImageFX( windsx[i] - mapstartx, windsy[i] - mapstarty, &spr[ WIND_SPRITE_+ windspr[i] ], windtrans[i], 2 );
	}
}			



void LighteningSetting( void )
{
	
	
	
}










///////////////////////////////////////////////////////////////////////////////
// window procedure


////////////////////// SoundUp lkh 수정(아래 전부) //////////////////////
DWORD	RainTime;
DWORD	RainStartTime, RainEndTime;
int		RainAmount;
BOOL	Statue_Weather;


int InitWeather( void )
{	
	RainStop();
	SnowStop();
	
	return 0;
}		

void RecvChangeWeather( t_rm_change_weather* p )
{
	if (g_bOffWeatherSystem)
	{	//< CSD-CN-031217
		return;
	}	//> CSD-CN-031217

	g_bStopWeatherSystem = p->bStopWeather;
	
	switch((int)p->bWeather)
	{
		//멈춤 
	case 0:
		{
			RainStop();
			SnowStop();
			Statue_Weather = 0;
		}
		break;
		//비 
	case 1:
		{
			DWORD amount = p->dwAmount;
			if( amount > 900)	amount  = 900;
			RainStart( amount, 0 );
			Statue_Weather = 1;
		}
		break;
		//눈
	case 2:
		{
			SnowStart( p->dwAmount , 0 );
			Statue_Weather = 2;
		}
		break;
		
	}
	
	
}
//		
short int g_RealDate;
void WeatherDataProcess( DWORD value, DWORD another, DWORD rainstart, DWORD rainend, int amount, int temperature )
{
		static int rainsound;
	g_CurrentTime = value;
	g_ServerClientTimeGap = g_CurrentTime - timeGetTime() + g_ping_delay;
	g_curr_time	= another;
				
	if (Hero == NULL)
	{
		return;
	}
	
	time_t lTime;
	time(&lTime);
	struct tm* today = localtime(&lTime);
	//Log( "Packet받음.txt", "%02d:%02d  %d", today->tm_min, today->tm_sec, addlen );
	if( today->tm_mon == 11 && ( today->tm_mday >=22 || today->tm_mday <= 29 ) )
	{
		if( MapInfo[ MapNumber].rain )
		{
			if( amount )
			{
				SnowStart( amount, 0 );
				Statue_Weather = 2;
			}	
			else
			{	
				SnowStop();
				Statue_Weather = 0;
			}	
		}	
	}			
	else		
	{			
		RainTime = 0;
		RainStartTime = rainstart;
		RainEndTime = rainend;
		
		if (MapInfo[MapNumber].rain)
		{
			if (0 > rainstart && 0 < rainend)
			{
				amount *= 10;
				
				if (amount > 900)
				{
					amount  = 900;
				}

				RainAmount = amount;
				RainStart(amount, 0);
				Statue_Weather = 1;
			}
			else
			{
				Statue_Weather = 0;
			}
		}
	}
	
	g_RealDate = temperature;
}

#define FRAME_PER_SEC		15
			  
// ani의 1초당 움직이는 
void CharWalkTime( LPCHARACTER ch, int ani )
{
	double dist = 0.0;
	double framepertime; 

	for( int d= 0 ;  d < ch->AnimationTable[ani].nCount ; d ++) //걷기에 대한 속도검사...
	  dist += (double)ch->AnimationTable[ani].dx[ d];

	// dist =  한번 Ani하는데 이동하는 Dot수.
	// ch->AnimationTable[ani].nCount  = Frame수.
	// framepertime = 32dot(1 Tile)이동하는데 걸리는 Frame수.
	// ch->walktime = 32dot(1 Tile)이동하는데 걸리는 mSEC.
	if( dist )
	{
	  framepertime = TILE_SIZE *(double) ch->AnimationTable[ani].nCount / dist;
	  ch->walktime = (int)( 1000 * framepertime / FRAME_PER_SEC); 
	}
}

int CharCalcMovP( LPCHARACTER ch )
{
	int ret = 50;
	int sx, sy, ex, ey;
	DWORD towalktime;
	
	if( (ch->desttime < g_ClientTime) ||  g_ClientTime == 0 )
	{
		ch->movp = ret;
		return ret;
	}
	
	sx = ch->x / TILE_SIZE;
	sy = ch->y / TILE_SIZE;
	ex = ch->path[ch->pathcount-1][0];
	ey = ch->path[ch->pathcount-1][1];
	
	DWORD d = ch->desttime - g_ClientTime;
	
	if( ch->desttime < g_ClientTime ) 
	{
		ch->movp = ret;
		return ret;
	}
	//	DWORD dist = (DWORD )sqrt( (ex-sx)*(ex-sx) + (ey-sy)*(ey-sy) );
	//	int resttile  = dist / TILE_SIZE;
	towalktime = d / (ch->pathcount +1);
	
	if( towalktime )
	{
		ret = ch->movp = (short )(ch->walktime * 50 / towalktime);
	}
	
	if( ret >= 200 ){ ret = 200;	ch->movp = 200;	}
	if( ret < 25 )	{ ret = 25;		ch->movp = 25;  }
	
	return ret;
}

void LoadChacterAnimationData_Tool( LPCHARACTER  ch )
{
	FILE *fp;
	int i, no, count;
	char temp[ FILENAME_MAX];
	int x, y, attackframe, wave, height, effect;
	char filename[ FILENAME_MAX];
	static int tempsprno;
	char gabage[20];
	
	
	sprintf( filename, "./char_test/%03dAniTable.txt", ch->sprno );
	if( GetSysInfo( SI_GAME_MAKE_MODE ) )	fp = Fopen( filename, "rt" );
	else fp = NULL;
	if( fp )
	{							
		ch->TotalAni = 0;
		for( i = 0 ; i < 50 ; i ++)
		{			
			count =0;
AGAIN_:		
			if( fgets( temp, FILENAME_MAX, fp ) == NULL ) break;
			
			if( temp[0] == '#' || temp[0] == ' ' || temp[0] == 10 || temp[0] == '\n' )  
			{
				if( temp[0] == '#' )
				{
					char *p;
					if( (p = strchr( temp, 10 )) ) *p = 0;
#ifdef _DEBUG
					strncpy( AnimationName[i], temp + 1, 100 );
#endif
					ch->TotalAni ++;
				}
				
				goto AGAIN_;
			}
			else goto PROCESS__;
			
			while( fgets( temp, FILENAME_MAX, fp ) != NULL )
			{	
PROCESS__:				
			if( temp[ 0] == ' ' || temp[0] == '\n' || temp[0] == '\r' )
			{
				ch->AnimationTable[i].nCount = count;
				break;
			}
			
			sscanf( temp, "%d %d %d %d %d %d %d ", &no, &x, &y, &attackframe, &wave, &height, &effect );
			//			no = atoi( temp ) -1;
			ch->AnimationTable[i].cFrame[ count]	= no-1;
			ch->AnimationTable[i].dx[ count]		=  x;
			ch->AnimationTable[i].dy[ count]		=  y;
			ch->AnimationTable[i].attackf[ count]	=  attackframe;
			ch->AnimationTable[i].wave[ count]		=  wave;
			ch->AnimationTable[i].height[ count]	=  height;
			ch->AnimationTable[i].effect[ count]	=  effect;
			count++;
			ch->AnimationTable[i].nCount = count;
			}	
		}		
		fclose(fp);
		
		int dist = 0;
		
		sprintf( filename, "./char_test/%03dAniTable.bin", ch->sprno );
		fp = Fopen( filename, "wb" );
		if( fp )
		{
			fwrite( gabage, 20,1, fp );
			char *tt = (char *)ch->AnimationTable;
			char crc = 0;
			for( i = 0 ; i < sizeof( PCANIMATIONTABLE ) * MAX_ANIMATION ; i ++)
			{
				crc += *tt;
				tt ++;
			}
			fwrite( &crc, 1,1, fp );
			fwrite( ch->AnimationTable, sizeof( PCANIMATIONTABLE ), MAX_ANIMATION, fp);
			fclose(fp);
		}
	}
	else 
	{
		sprintf(filename, "./char_test/%03dAniTable.bin", ch->sprno);
		fp = Fopen( filename, "rb" );
		char *tt = (char *)ch->AnimationTable;
		char crc = 0, crc1;
		if( fp )
		{
			fseek( fp, 20, SEEK_SET );
			fread( &crc1, 1,1, fp );
			fread( ch->AnimationTable, sizeof( PCANIMATIONTABLE ), MAX_ANIMATION, fp);
			for( i = 0 ; i < sizeof( PCANIMATIONTABLE ) * MAX_ANIMATION ;  i ++)
			{
				crc += *tt;
				tt ++;
			}
			fclose(fp);
			
			if( abs(crc1 - crc) )
			{
				//if( SysInfo.gamemakemode ) JustMsg( "CHECKSUM_ERROR_ANIMATIONDATA : ch->sprno = %d ",  ch->sprno );
				CheckSumError = CHECKSUM_ERROR_ANIMATIONDATA;
			}
			
			sprintf(filename, "./char_test/%03dAniTable.tmp", ch->sprno);
			ofstream fout(filename);
			string strTemp;
			
			for (int j = 0; j < MAX_ANIMATION; j++)
			{
				if (ch->sprno >= 0 && ch->sprno <= 1)
				{ // PC인 경우
					switch (j)
					{
					case ACTION_NONE:                strTemp = "# 기본동작."; break;
					case ACTION_BASIC_WALK:          strTemp = "# 기본걷기."; break;
					case ACTION_BATTLE_WALK_OWNHAND: strTemp = "# 전투걷기1(한손무기)."; break;
					case ACTION_BATTLE_NONE:         strTemp = "# 전투기본1(한손무기)."; break;
					case ACTION_ATTACK_ONESWORD1:    strTemp = "# 한손공격1."; break;
					case ACTION_ATTACK_ONESWORD2:    strTemp = "# 한손공격2."; break;  
					case ACTION_ATTACK_BONG_DOWN:    strTemp = "# 중거리 무기 공격(내려치기)."; break;
					case ACTION_ATTACK_BONG_JJIRKI:  strTemp = "# 중거리 무기 공격(찌르기)."; break;
					case ACTION_ATTACK_BOW:          strTemp = "# 활쏘기."; break;      
					case ACTION_ATTACK_PENSWORD2:    strTemp = "# 펜싱자세."; break;   
					case ACTION_ATTACK_PENSING1:     strTemp = "# 펜싱공격 1."; break; 
					case ACTION_ATTACK_PENSING2:     strTemp = "# 펜싱공격 2."; break; 
					case ACTION_RUN:                 strTemp = "# 뛰기."; break;
					case ACTION_ATTACKED:            strTemp = "# 맞기."; break;
					case ACTION_DIE:                 strTemp = "# 죽기."; break;
					case ACTION_MAGIC_BEFORE:        strTemp = "# 마법시전."; break;
					case ACTION_MAGIC_CASTING:       strTemp = "# 마법캐스팅."; break;
					case ACTION_SITDOWN:             strTemp = "# 앉기."; break;
					case ACTION_THROW:               strTemp = "# 던지기공격."; break;
					case ACTION_HORSE:               strTemp = "# 말타기."; break;
					case ACTION_BATTLE_WALK_TWOHAND: strTemp = "# 전투걷기2(양손무기)."; break;
					case ACTION_BATTLE_NONE_TWOHAND: strTemp = "# 전투기본2(양손무기)."; break;
					case ACTION_ATTACK_BONG_ROUND:   strTemp = "# 중거리 무기 공격(휘두르기)."; break;
					case ACTION_MAGIC_CASTING2:      strTemp = "# 마법캐스팅2(남자)."; break;
					default: continue;
					}
				}
				else
				{ // NPC인 경우
					switch (j)
					{
					case MON1_NONE:          strTemp = "# 기본동작."; break;
					case MON1_BATTLE_WALK:   strTemp = "# 기본걷기."; break;
					case MON1_ATTACKED:		   strTemp = "# 맞기동작."; break;
					case MON1_DIE:			     strTemp = "# 죽기동작."; break;
					case MON1_BATTLE_ATTACK: strTemp = "# 공격동작."; break;
					case MON1_BATTLE_MAGIC:  strTemp = "# 마법동작."; break;
					case MON1_STAND_UP	: strTemp = "# 일어서기."; break;			// 일어서기
					case MON1_CASTING_MAGIC : strTemp = "# 마법시전."; break;		// 08마법시전			// LTS DRAGON MODIFY
					case MON1_BATTLE_ATTACK2 : strTemp = "# 공격2."; break;	// 09공격 2
					case MON1_BATTLE_ATTACK3 : strTemp = "# 공격3."; break;	// 10공격 3
					case MON1_JUST_ACTION : strTemp = "# 임의의동작."; break;		// 11임의의 동작 	
					default: continue;
					}
				}
				
				fout << strTemp.c_str() << endl; 
#ifdef _DEBUG
				strncpy(AnimationName[j], strTemp.c_str() + 1, 100);
#endif
				++ch->TotalAni;
				
				const int nCount = ch->AnimationTable[j].nCount;
				
				for (int k = 0; k < nCount; k++)
				{
					int nFrame = ch->AnimationTable[j].cFrame[k] + 1;
					int nDX = ch->AnimationTable[j].dx[k];
					int nDY = ch->AnimationTable[j].dy[k];
					int nAttack = ch->AnimationTable[j].attackf[k];
					int nWave = ch->AnimationTable[j].wave[k];
					int nHeight = ch->AnimationTable[j].height[k];
					int nEffect = ch->AnimationTable[j].effect[k];
					fout << nFrame << "\t";
					fout << nDX << "\t";
					fout << nDY << "\t";
					fout << nAttack << "\t";
					fout << nWave << "\t";
					fout << nHeight << "\t";
					fout << nEffect << endl;
				}
				
				fout << endl;
			} 
		}
		else 
		{
			if( GetSysInfo( SI_GAME_MAKE_MODE ) ) JustMsg( "CheckNumError : ch->sprno = %d ( No File )",  ch->sprno );	// 010612 KHS
			CheckSumError = CHECKSUM_ERROR_ANIMATIONDATA;			
		}
	}
}

void LoadChacterAnimationData( LPCHARACTER  ch )
{				
	FILE *fp;
	int i, no, count;
	char temp[ FILENAME_MAX];
	int x, y, attackframe, wave, height, effect;
	char filename[ FILENAME_MAX];
	static int tempsprno;
	char gabage[20];
	
	
	sprintf( filename, "./CHAR/%03dAniTable.txt", ch->sprno );
	if( GetSysInfo( SI_GAME_MAKE_MODE ) )	fp = Fopen( filename, "rt" );
	else fp = NULL;
	if( fp )
	{							
		ch->TotalAni = 0;
		for( i = 0 ; i < 50 ; i ++)
		{			
			count =0;
AGAIN_:		
			if( fgets( temp, FILENAME_MAX, fp ) == NULL ) break;
												
			if( temp[0] == '#' || temp[0] == ' ' || temp[0] == 10 || temp[0] == '\n' )  
			{
				if( temp[0] == '#' )
				{
					char *p;
					if( (p = strchr( temp, 10 )) ) *p = 0;
#ifdef _DEBUG
					strncpy( AnimationName[i], temp + 1, 100 );
#endif
					ch->TotalAni ++;
				}
				
				goto AGAIN_;
			}
			else goto PROCESS__;
			
			while( fgets( temp, FILENAME_MAX, fp ) != NULL )
			{	
PROCESS__:				
			if( temp[ 0] == ' ' || temp[0] == '\n' || temp[0] == '\r' )
			{
				ch->AnimationTable[i].nCount = count;
				break;
			}
			
			sscanf( temp, "%d %d %d %d %d %d %d ", &no, &x, &y, &attackframe, &wave, &height, &effect );
			//			no = atoi( temp ) -1;
			ch->AnimationTable[i].cFrame[ count]	= no-1;
			ch->AnimationTable[i].dx[ count]		=  x;
			ch->AnimationTable[i].dy[ count]		=  y;
			ch->AnimationTable[i].attackf[ count]	=  attackframe;
			ch->AnimationTable[i].wave[ count]		=  wave;
			ch->AnimationTable[i].height[ count]	=  height;
			ch->AnimationTable[i].effect[ count]	=  effect;
			count++;
			ch->AnimationTable[i].nCount = count;
			}	
		}		
		fclose(fp);
		
		int dist = 0;
		
		sprintf( filename, "./CHAR/%03dAniTable.bin", ch->sprno );
		fp = Fopen( filename, "wb" );
		if( fp )
		{
			fwrite( gabage, 20,1, fp );
			char *tt = (char *)ch->AnimationTable;
			char crc = 0;
			for( i = 0 ; i < sizeof( PCANIMATIONTABLE ) * MAX_ANIMATION ; i ++)
			{
				crc += *tt;
				tt ++;
			}
			fwrite( &crc, 1,1, fp );
			fwrite( ch->AnimationTable, sizeof( PCANIMATIONTABLE ), MAX_ANIMATION, fp);
			fclose(fp);
		}
	}
	else
	{
		sprintf(filename, "./CHAR/%03dAniTable.bin", ch->sprno);
		const AnimationTableLoadResult result = LoadAnimationTableBinary(
			filename, ch->AnimationTable, MAX_ANIMATION);
		if (result != ANIMATION_TABLE_OK)
		{
			if (GetSysInfo(SI_GAME_MAKE_MODE))
				JustMsg("Animation table load failed: %s", filename);
			CheckSumError = CHECKSUM_ERROR_ANIMATIONDATA;
		}
	}
}			



void LoadClothOrderData( void )
{			
	FILE *fp;
	
	fp = Fopen( "./char/00ClothOrderBasic.bin","rb" );
	if( fp )
	{		
		for( int i = 0 ; i < 8 ; i ++)
			for( int j = 0 ; j < 75 ; j ++)
				fread( &SpriteOrder[0][i][j], 1,1, fp );
			fclose(fp);
	}		
	fp = Fopen( "./char/01ClothOrderBasic.bin","rb" );
	if( fp )
	{		
		for( int i = 0 ; i < 8 ; i ++)
			for( int j = 0 ; j < 75 ; j ++)
				fread( &SpriteOrder[1][i][j], 1,1, fp );
			fclose(fp);
	}		
	fp = Fopen( "./char/00ClothOrderBow.bin","rb" );
	if( fp )
	{		
		for( int i = 0 ; i < 8 ; i ++)
			for( int j = 0 ; j < 75 ; j ++)
				fread( &SpriteOrder[2][i][j], 1,1, fp );
			fclose(fp);
	}		
	fp = Fopen( "./char/01ClothOrderBow.bin","rb" );
	if( fp )
	{		
		for( int i = 0 ; i < 8 ; i ++)
			for( int j = 0 ; j < 75 ; j ++)
				fread( &SpriteOrder[3][i][j], 1,1, fp );
			fclose(fp);
	}		
}			






//----------------------------------------

// 배경 Sprite를 찍기 위한 루틴.


void PutTileNotCliping( int x, int y, LPVOID Stmp, LPVOID dest )
{
	char* dstRow = (char*)dest + y * dDxSize + (x * 2);
	const char* srcRow = (const char*)Stmp;
	for (int r = 0; r < 32; r++) {
		memcpy(dstRow, srcRow, 64);
		dstRow += dDxSize;
		srcRow += 64;
	}
}

void PutTileCliping( int x, int y, LPVOID Stmp, LPVOID dest, int lx, int rx, int ty, int by )
{
	int  xl = TILE_SIZE;
	int  yl = TILE_SIZE;
	WORD *p, *sou;
	int  i,j;
	
	sou = (WORD *)((char*)Stmp + (lx + ty * xl) * 2);
	for( i = ty ; i < by ; i ++)
	{	
		p = (WORD*)((char *)dest + x * 2 + y * dDxSize);
		for( j = lx ; j < rx ; j ++, p++, sou++ )
			*p = *sou;
		
		sou += ( xl - ( rx - lx ) );
		y ++;
	}	
}


void PutTile( int x, int y, LPVOID Stmp, LPVOID dest )
{
	int	lx, rx, ty, by , IsC=0;
	int xl = TILE_SIZE;
	int yl = TILE_SIZE;
	
	if( x >= SCREEN_WIDTH  )			return; 
	else if( x + xl < 0 )	return; 
	if( y >= SCREEN_HEIGHT )			return; 
	else if( y + yl < 0  )	return;
	
	rx = xl;
	lx = 0;
	ty = 0;
	by = yl;
	
	if( x + xl > SCREEN_WIDTH )
	{
		rx -= x + xl - SCREEN_WIDTH;
		IsC = 1;
	}
	if( x < 0 )
	{	
		lx  = 0 - x;
		x   = 0;
		//		rx -= lx;
		IsC = 1;
	}	
	if( y + yl > SCREEN_HEIGHT )
	{	
		by -= y + yl - SCREEN_HEIGHT;
		IsC = 1;
	}	
	if(	y < 0 )
	{	
		ty  = 0 - y;
		y   = 0;
		//		by -= ty;
		IsC = 1;
	}		
	
	if(IsC)		PutTileCliping( x, y, Stmp, dest, lx, rx, ty, by );
	else 		PutTileNotCliping( x, y, Stmp, dest );
}






WORD RGB16( int r, int g, int b )
{	
	r >>= 3;
	g >>= 3;
	b >>= 3;
	if( _PixelInfo.BitMaskR != 0x7C00)
	{
		return ((r)<< 11) | (g)<<6 |(b);
	}
	return ((r)<< 10) | (g)<<5 |(b);
}


DWORD ReturnBlendRGB( int r, int g, int b )
{
	WORD rgb = (WORD)RGB16( r, g, b );
	if( _PixelInfo.BitMaskR == 0x7C00)
	{
		return ((DWORD)(rgb & 0x1F)) | (((DWORD)((rgb >> 5) & 0x1F)) << 11) | (((DWORD)((rgb >> 10) & 0x1F)) << 21);
	}
	else
	{
		return ((DWORD)(rgb & 0x1F)) | (((DWORD)((rgb >> 5) & 0x3F)) << 10) | (((DWORD)((rgb >> 11) & 0x1F)) << 21);
	}
}

void ViewVersion( int version )
{	//< CSD-030509
	return;			// 0625 YGI
	char temp[ MAX_PATH];
	sprintf( temp, "v.%03d", version );
	Hcolor( 0, 0, 0 );
	Hprint( SCREEN_WIDTH - strlen( temp) *12, 3, g_DestBackBuf, temp );
	Hcolor( 150, 150, 150 );
	Hprint( SCREEN_WIDTH - strlen( temp) *12-1, 2, g_DestBackBuf, temp );
	
	int mapx = g_Map.x + g_pointMouseX/TILE_SIZE;
	int mapy = g_Map.y + g_pointMouseY/TILE_SIZE;
	HprintBold( SCREEN_WIDTH - 30* 12 - 5, 31, 0xffff, 0,  lan->OutputMessage(6,52), MapNumberName, mapx, mapy);
}	//> CSD-030509

static int		HEAD, TAIL;

#define MAX_QUEUE_SPRITE    3000

HANDLE ghLoadCharSpriteDataThread;
DWORD  gdwLoadCharSpriteDataThread;

typedef struct 
{	
	char filename[FILENAME_MAX];
	char **buf;
	DWORD *length;
	CharacterSprite *charactersprite;
}t_queueSprite;


t_queueSprite  queueSprite[ MAX_QUEUE_SPRITE];



void ClearQueueSprite( void )
{		
	HEAD = TAIL = 0;
}		

int queueInSprite( t_queueSprite *n )
{			
	g_criticThread.Lock();
	
	if( (TAIL+1) %  MAX_MQUEUE != HEAD )
	{	
		memcpy( &queueSprite[TAIL], n, sizeof( t_queueSprite ) );
		TAIL ++;
		TAIL = TAIL % MAX_MQUEUE ;
		g_criticThread.Unlock();
		return 1;
	}	
	g_criticThread.Unlock();
	return 0;
}		

int queueOutSprite( t_queueSprite *n)
{		
	if( TAIL != HEAD )
	{	
		memcpy( n, &queueSprite[HEAD], sizeof( t_queueSprite ) );
		HEAD ++;
		HEAD = HEAD % MAX_MQUEUE;
		return 1;
	}	
	
	n = NULL;
	return 0;
}		

void InputThreadCharSprite( char *filename, char **buf, DWORD *length, CharacterSprite *charactersprite, int mode )
{	
	t_queueSprite n;
	
	strcpy( n.filename, filename );
	n.buf				= buf;
	n.length			= length;
	n.charactersprite	= charactersprite;
	
	if( queueInSprite( &n ) )
	{}
	else Error( lan->OutputMessage(6,53));//lsw
}	


DWORD __stdcall LoadCharSpriteDataThread( void *g )
{	
	t_queueSprite n;
	
	while( 1 )
	{
		if( queueOutSprite( &n) )
		{
			LoadingCharSpriteData = true;
			LoadCharSpriteData_Sub( n.filename, n.buf, n.length, n.charactersprite, LD_CHAR_SPRITE_ALL_LOAD );
			LoadingCharSpriteData = false;
		}
		Sleep(10);
    }
	
	return 0;
}	


void StartLoadCharSpriteDataThread( void )
{
	StartLoadCharSpriteDataThreadFlag = false;
}

void EndLoadCharSpriteDataThread( void )
{
	StartLoadCharSpriteDataThreadFlag = false;
}



