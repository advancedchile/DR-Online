/*

*/


#define MAX_ITEM_COLLISION		100


#ifndef	__PATH_H__
#define	__PATH_H__

#include "dragon.h"
#include "char.h"

typedef struct	tagSPNODE
{
	int					f, h, g;
	int					x, y;
	int					number;
	struct tagSPNODE	*lpParent;
	struct tagSPNODE	*lpChild[ 8 ];
	struct tagSPNODE	*lpNext;
} SP_NODE, *LPSP_NODE;

typedef struct	tagSPSTACK
{
	struct tagSPNODE	*lpNode;
	struct tagSPSTACK	*lpNext;
} SP_STACK, *LPSP_STACK;





typedef struct  tagColisionLine
{
	int sx, sy, dx, dy;
}COLLISIONLINE, *LPCOLLISIONLINE;






#ifdef __cplusplus
extern "C"
{
#endif


	extern int  PathCollisionLineCount; //   길�기에 사용될 아이템을 모아 놓는다.
	extern COLLISIONLINE PathCollisionLine[ MAX_ITEM_COLLISION ];


	extern BOOL			PathBuild( LPCHARACTER lpCharacter );
	extern void			PathDestroy( void );
	extern LPSP_NODE	PathFind( LPCHARACTER lpcharacter,int sx, int sy, int dx, int dy );

	extern int			FreeTile( LPCHARACTER lpcharacter, int sx, int sy, int x, int y );
	extern int			FreeTileOther( LPCHARACTER ch, int sx, int sy );

	extern int CheckLineCollision( LPCHARACTER ch, int sx, int sy, int ex, int ey );

	////////////////////////0724 yjs /////////////////////////////////////////////////
	////////////////////////타일 한칸일 앞으로 가면서 체크하는 함수////////////////////
	extern int			Tile_Collision(LPCHARACTER ch, DIRECTION dir, int Power);
	////////////////////////////////////////////////////////////////////////////////////

	///////////////////0728 yjs //////////////////////////////////////////////
	//	extern void			Reaction(LPCHARACTER ch, DIRECTION &, int &); 
	/////////////////////////////////////////////////////////////////////////



	#ifdef __cplusplus
}
#endif

#endif	// __PATH_H__











