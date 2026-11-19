#include	"stdafx.h"
#include	"dragon.h"
#include	"network.h"
#include	"char.h"
#include	"map.h"
#include	"DirectSound.h"

#define	QSF_TELEPORT		1

void	RecvQSF_Command( t_qsf_command	qc )
{
	switch(qc.command)
	{
	case QSF_TELEPORT:		//Teleport
		if (Hero && qc.x > 0 && qc.y > 0)
		{
			Hero->position.x = qc.x;
			Hero->position.y = qc.y;
			Hero->x = Hero->gox = qc.x * TILE_SIZE + 16;
			Hero->y = Hero->goy = qc.y * TILE_SIZE + 16;
			Hero->pathcount = 0;
			Hero->moveFlag = 0;
			StartSetView(Hero);
			PlayListAutoSounds(2408, 0, 0, 0);
		}
		break;
	default:
		break;
	}
}